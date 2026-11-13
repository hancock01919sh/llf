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

function fingerprint(updatedAt: string, total: number) {
  return { data: [{ updatedAt }], meta: { pagination: { total } } };
}

const pageStart = (url: string) => new URL(url).searchParams.get('pagination[start]');
const isFingerprint = (url: string) => url.includes('fields%5B0%5D=updatedAt');

describe('createCatalogSource: file mode', () => {
  it('uses the bundled fixture when no URL is configured', async () => {
    const source = createCatalogSource({ refreshMs: 60_000 });
    expect(await source.version()).toBe(fixture.catalogVersion);
    const matcher = await source.matcher();
    expect(matcher.match('spinach')?.slug).toBe('spinach');
    expect(matcher.match('kale')).toBeNull();
    expect(await source.matcher()).toBe(matcher);
  });

  it('exposes a static catalog without a network', async () => {
    const source = staticCatalogSource(fixture);
    expect(await source.version()).toBe(fixture.catalogVersion);
    expect((await source.matcher()).match('spinach')?.slug).toBe('spinach');
  });
});

describe('createCatalogSource: URL mode', () => {
  it('loads the whole catalog once, in pages', async () => {
    const fetch = fakeFetch([
      { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 3) },
      { status: 200, body: page(['Onions', 'Zucchini'], 0, 2, 3) },
      { status: 200, body: page(['Kale'], 2, 2, 3) },
    ]);
    const source = createCatalogSource({ catalogUrl: CATALOG_URL, refreshMs: 60_000, fetch });

    const matcher = await source.matcher();

    expect(isFingerprint(fetch.calls[0]!.url)).toBe(true);
    expect(fetch.calls.slice(1).map((call) => pageStart(call.url))).toEqual(['0', '2']);
    expect(matcher.match('Onions')?.slug).toBe('onions');
    expect(matcher.match('Zucchini')?.slug).toBe('zucchini');
    expect(matcher.match('Kale')?.slug).toBe('kale');
    expect(matcher.match('Durian')).toBeNull();
  });

  it('matches terms that were never looked up before', async () => {
    const fetch = fakeFetch([
      { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 2) },
      { status: 200, body: page(['Onions', 'Kale'], 0, 100, 2) },
    ]);
    const source = createCatalogSource({ catalogUrl: CATALOG_URL, refreshMs: 60_000, fetch });

    const matcher = await source.matcher();

    expect(matcher.match('Kale')?.slug).toBe('kale');
    expect(fetch.calls).toHaveLength(2);
  });

  it('reuses the loaded catalog within the refresh window', async () => {
    let time = 0;
    const fetch = fakeFetch([
      { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 1) },
      { status: 200, body: page(['Onions'], 0, 100, 1) },
    ]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch,
      now: () => time,
    });

    const first = await source.matcher();
    time = 999;
    expect(await source.matcher()).toBe(first);
    expect(fetch.calls).toHaveLength(2);
  });

  it('skips the reload when the fingerprint is unchanged', async () => {
    let time = 0;
    const fetch = fakeFetch([
      { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 1) },
      { status: 200, body: page(['Onions'], 0, 100, 1) },
      { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 1) },
    ]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch,
      now: () => time,
    });

    const first = await source.matcher();
    time = 1_000;
    expect(await source.matcher()).toBe(first);
    expect(fetch.calls).toHaveLength(3);
    expect(isFingerprint(fetch.calls[2]!.url)).toBe(true);
  });

  it('reloads the pages when the fingerprint changes', async () => {
    let time = 0;
    const fetch = fakeFetch([
      { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 1) },
      { status: 200, body: page(['Onions'], 0, 100, 1) },
      { status: 200, body: fingerprint('2026-02-01T00:00:00.000Z', 2) },
      { status: 200, body: page(['Onions', 'Kale'], 0, 100, 2) },
    ]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch,
      now: () => time,
    });

    const firstVersion = await source.version();
    const first = await source.matcher();
    expect(firstVersion).toBe(await source.version());

    time = 1_000;
    expect(await source.version()).not.toBe(firstVersion);
    const second = await source.matcher();
    expect(second).not.toBe(first);
    expect(second.match('Kale')?.slug).toBe('kale');
    expect(fetch.calls.map((call) => pageStart(call.url))).toEqual([null, '0', null, '0']);
  });

  it('sends the catalog token as a bearer header', async () => {
    const fetch = fakeFetch([
      { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 1) },
      { status: 200, body: page(['Onions'], 0, 100, 1) },
    ]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      catalogToken: 'secret',
      refreshMs: 60_000,
      fetch,
    });
    await source.matcher();
    expect(fetch.calls.map((call) => call.authorization)).toEqual([
      'Bearer secret',
      'Bearer secret',
    ]);
  });

  it('keeps the last catalog when a refresh fails', async () => {
    let time = 0;
    const fetch = fakeFetch([
      { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 1) },
      { status: 200, body: page(['Onions'], 0, 100, 1) },
      { status: 500 },
    ]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch,
      now: () => time,
    });
    await source.matcher();

    time = 2_000;
    expect((await source.matcher()).match('Onions')?.slug).toBe('onions');
  });

  it('throws when the first load fails', async () => {
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch: fakeFetch([{ status: 503 }]),
    });
    await expect(source.matcher()).rejects.toThrow('catalog fetch failed: 503');
  });

  it('reports a derived version when the catalog cannot be loaded', async () => {
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch: fakeFetch([{ status: 503 }]),
    });
    expect(await source.version()).toMatch(/^[0-9a-f]{12}$/);
  });

  it('rejects a malformed fingerprint', async () => {
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch: fakeFetch([{ status: 200, body: { nope: true } }]),
    });
    await expect(source.matcher()).rejects.toThrow();
  });

  it('rejects a malformed page', async () => {
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch: fakeFetch([
        { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 1) },
        { status: 200, body: { nope: true } },
      ]),
    });
    await expect(source.matcher()).rejects.toThrow();
  });

  it('shares one load between concurrent calls', async () => {
    const fetch = fakeFetch([
      { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 1) },
      { status: 200, body: page(['Onions'], 0, 100, 1) },
    ]);
    const source = createCatalogSource({ catalogUrl: CATALOG_URL, refreshMs: 60_000, fetch });

    const [a, b] = await Promise.all([source.matcher(), source.matcher()]);
    expect(a).toBe(b);
    expect(fetch.calls).toHaveLength(2);
  });

  it('announces the catalog only when it reloads', async () => {
    let time = 0;
    const loaded: string[] = [];
    const fetch = fakeFetch([
      { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 1) },
      { status: 200, body: page(['Onions'], 0, 100, 1) },
      { status: 200, body: fingerprint('2026-01-01T00:00:00.000Z', 1) },
    ]);
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch,
      now: () => time,
      onLoad: (version) => loaded.push(version),
    });

    await source.matcher();
    await source.matcher();
    time = 1_000;
    await source.matcher();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatch(/^[0-9a-f]{12}$/);
  });
});
