import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { createCatalogSource, staticCatalogSource } from './catalog';

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/catalog.json', import.meta.url), 'utf8'),
) as {
  catalogVersion: string;
  ingredients: { slug: string; title: string; synonyms: string[] }[];
};

const CATALOG_URL = 'https://cms.test/api/ingredients';
const paged = (start: number) =>
  `${CATALOG_URL}?fields%5B0%5D=title&fields%5B1%5D=synonyms&pagination%5Bstart%5D=${start}&pagination%5Blimit%5D=100`;

type Reply = { status: number; body?: unknown } | Error;

function fakeFetch(replies: Reply[]) {
  const calls: { url: string; authorization: string | null }[] = [];
  const fetch = async (input: string, init?: RequestInit): Promise<Response> => {
    calls.push({
      url: input,
      authorization: new Headers(init?.headers).get('authorization'),
    });
    const reply = replies.shift();
    if (!reply) throw new Error('no more replies');
    if (reply instanceof Error) throw reply;
    const body = reply.body === undefined ? null : JSON.stringify(reply.body);
    return new Response(body, {
      status: reply.status,
      headers: { 'content-type': 'application/json' },
    });
  };
  return Object.assign(fetch, { calls });
}

function page(titles: string[], start: number, limit: number, total: number) {
  return {
    data: titles.map((title) => ({ title, synonyms: null })),
    meta: { pagination: { start, limit, total } },
  };
}

function versionPage(updatedAt: string, total: number) {
  return { data: [{ updatedAt }], meta: { pagination: { total } } };
}

describe('createCatalogSource: file mode', () => {
  it('uses the bundled fixture when no URL is configured', async () => {
    const source = createCatalogSource({ refreshMs: 60_000 });
    expect(await source.version()).toBe(fixture.catalogVersion);
    const matcher = await source.matcher([]);
    expect(matcher.match('spinach')?.slug).toBe('spinach');
    expect(matcher.match('kale')).toBeNull();
    expect(await source.matcher([])).toBe(matcher);
  });

  it('exposes a static catalog without a network', async () => {
    const source = staticCatalogSource(fixture);
    expect(await source.version()).toBe(fixture.catalogVersion);
    expect((await source.matcher([])).match('spinach')?.slug).toBe('spinach');
  });
});

describe('createCatalogSource: URL mode', () => {
  it('resolves only the requested terms, following the page limit', async () => {
    const fetch = fakeFetch([
      { status: 200, body: page(['Onions', 'Zucchini'], 0, 2, 3) },
      { status: 200, body: page(['Kale'], 2, 2, 3) },
    ]);
    const source = createCatalogSource({ catalogUrl: CATALOG_URL, refreshMs: 60_000, fetch });

    const matcher = await source.matcher(['Onions', 'Kale']);

    expect(matcher.match('Onions')?.slug).toBe('onions');
    expect(matcher.match('Kale')?.slug).toBe('kale');
    expect(fetch.calls.map((call) => call.url)).toEqual([paged(0), paged(2)]);
  });

  it('stops after one page when every term matches strongly', async () => {
    const fetch = fakeFetch([{ status: 200, body: page(['Onions'], 0, 100, 1) }]);
    const source = createCatalogSource({ catalogUrl: CATALOG_URL, refreshMs: 60_000, fetch });
    await source.matcher(['Onions']);
    expect(fetch.calls.map((call) => call.url)).toEqual([paged(0)]);
  });

  it('sends the catalog token as a bearer header', async () => {
    const fetch = fakeFetch([{ status: 200, body: page(['Onions'], 0, 100, 1) }]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      catalogToken: 'secret',
      refreshMs: 60_000,
      fetch,
    });
    await source.matcher(['Onions']);
    expect(fetch.calls[0]?.authorization).toBe('Bearer secret');
  });

  it('caches each term until it expires', async () => {
    let time = 0;
    const fetch = fakeFetch([
      { status: 200, body: page(['Onions'], 0, 100, 1) },
      { status: 200, body: page(['Onions'], 0, 100, 1) },
    ]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch,
      now: () => time,
    });

    expect((await source.matcher(['Onions'])).match('Onions')?.slug).toBe('onions');
    time = 500;
    expect((await source.matcher(['Onions'])).match('Onions')?.slug).toBe('onions');
    expect(fetch.calls).toHaveLength(1);

    time = 1_000;
    expect((await source.matcher(['Onions'])).match('Onions')?.slug).toBe('onions');
    expect(fetch.calls).toHaveLength(2);
  });

  it('caches a miss too', async () => {
    const fetch = fakeFetch([{ status: 200, body: page(['Onions'], 0, 100, 1) }]);
    const source = createCatalogSource({ catalogUrl: CATALOG_URL, refreshMs: 60_000, fetch });
    expect((await source.matcher(['Durian'])).match('Durian')).toBeNull();
    expect((await source.matcher(['Durian'])).match('Durian')).toBeNull();
    expect(fetch.calls).toHaveLength(1);
  });

  it('keeps the last match when a refresh fails', async () => {
    let time = 0;
    const fetch = fakeFetch([
      { status: 200, body: page(['Onions'], 0, 100, 1) },
      { status: 500 },
    ]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch,
      now: () => time,
    });
    await source.matcher(['Onions']);

    time = 2_000;
    expect((await source.matcher(['Onions'])).match('Onions')?.slug).toBe('onions');
  });

  it('throws when the first lookup fails', async () => {
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch: fakeFetch([{ status: 503 }]),
    });
    await expect(source.matcher(['Onions'])).rejects.toThrow();
  });

  it('rejects a malformed page', async () => {
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch: fakeFetch([{ status: 200, body: { nope: true } }]),
    });
    await expect(source.matcher(['Onions'])).rejects.toThrow();
  });

  it('derives the version from the newest row and the total', async () => {
    let time = 0;
    const fetch = fakeFetch([
      { status: 200, body: versionPage('2026-01-01T00:00:00.000Z', 20) },
      { status: 200, body: versionPage('2026-02-01T00:00:00.000Z', 20) },
    ]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch,
      now: () => time,
    });

    const first = await source.version();
    expect(first).toMatch(/^[0-9a-f]{12}$/);
    expect(fetch.calls[0]?.url).toContain('sort=updatedAt%3Adesc');
    expect(await source.version()).toBe(first);
    expect(fetch.calls).toHaveLength(1);

    time = 1_000;
    expect(await source.version()).not.toBe(first);
  });

  it('keeps the last version when the probe fails', async () => {
    let time = 0;
    const fetch = fakeFetch([
      { status: 200, body: versionPage('2026-01-01T00:00:00.000Z', 20) },
      { status: 500 },
    ]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch,
      now: () => time,
    });

    const first = await source.version();
    time = 2_000;
    expect(await source.version()).toBe(first);
  });

  it('shares one lookup between concurrent calls for the same terms', async () => {
    const fetch = fakeFetch([{ status: 200, body: page(['Onions'], 0, 100, 1) }]);
    const source = createCatalogSource({ catalogUrl: CATALOG_URL, refreshMs: 60_000, fetch });

    const [a, b] = await Promise.all([source.matcher(['Onions']), source.matcher(['Onions'])]);
    expect(a.match('Onions')?.slug).toBe('onions');
    expect(b.match('Onions')?.slug).toBe('onions');
    expect(fetch.calls).toHaveLength(1);
  });

  it('shares page requests between concurrent overlapping lookups', async () => {
    const fetch = fakeFetch([
      { status: 200, body: page(['Onions'], 0, 1, 2) },
      { status: 200, body: page(['Kale'], 1, 1, 2) },
    ]);
    const source = createCatalogSource({ catalogUrl: CATALOG_URL, refreshMs: 60_000, fetch });

    const [a, b] = await Promise.all([source.matcher(['Onions']), source.matcher(['Kale'])]);
    expect(a.match('Onions')?.slug).toBe('onions');
    expect(b.match('Kale')?.slug).toBe('kale');
    expect(fetch.calls.map((call) => call.url)).toEqual([paged(0), paged(1)]);
  });

  it('announces the catalog once', async () => {
    const loaded: string[] = [];
    const fetch = fakeFetch([
      { status: 200, body: page(['Onions'], 0, 100, 1) },
      { status: 200, body: page(['Onions'], 0, 100, 1) },
    ]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 60_000,
      fetch,
      onLoad: (version) => loaded.push(version),
    });
    await source.matcher(['Onions']);
    await source.matcher(['Garlic']);
    expect(loaded).toHaveLength(1);
  });
});
