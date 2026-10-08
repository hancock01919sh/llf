import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { createCatalogSource } from './catalog';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/catalog.json', import.meta.url), 'utf8')) as {
  catalogVersion: string;
  ingredients: { slug: string; title: string; synonyms: string[] }[];
};

const CATALOG_URL = 'https://cms.test/api/catalog';

const v2 = {
  catalogVersion: 'v2',
  ingredients: [...fixture.ingredients, { slug: 'kale', title: 'Kale', synonyms: [] }],
};

type Reply = { status: number; body?: unknown; etag?: string } | Error;

function fakeFetch(replies: Reply[]) {
  const calls: { url: string; ifNoneMatch: string | null }[] = [];
  const fetch = async (input: string, init?: RequestInit): Promise<Response> => {
    calls.push({ url: input, ifNoneMatch: new Headers(init?.headers).get('if-none-match') });
    const reply = replies.shift();
    if (!reply) throw new Error('no more replies');
    if (reply instanceof Error) throw reply;
    const headers = new Headers({ 'content-type': 'application/json' });
    if (reply.etag) headers.set('etag', reply.etag);
    const body = reply.status === 304 || reply.body === undefined ? null : JSON.stringify(reply.body);
    return new Response(body, { status: reply.status, headers });
  };
  return Object.assign(fetch, { calls });
}

describe('createCatalogSource', () => {
  it('uses the bundled fixture when no URL is configured', async () => {
    const source = createCatalogSource({ refreshMs: 60_000 });
    const snapshot = await source.get();
    expect(snapshot.catalogVersion).toBe('d6b0257e63c4');
    expect(snapshot.matcher.match('spinach')?.slug).toBe('spinach');
    expect(await source.get()).toBe(snapshot);
  });

  it('revalidates with the ETag once stale', async () => {
    let time = 0;
    const fetch = fakeFetch([
      { status: 200, body: fixture, etag: '"a"' },
      { status: 304 },
      { status: 200, body: v2, etag: '"b"' },
    ]);
    const loaded: string[] = [];
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch,
      now: () => time,
      onLoad: (version) => loaded.push(version),
    });

    const first = await source.get();
    time = 500;
    expect(await source.get()).toBe(first);
    expect(fetch.calls).toHaveLength(1);

    time = 1_000;
    expect(await source.get()).toBe(first);
    expect(fetch.calls[1]).toEqual({ url: CATALOG_URL, ifNoneMatch: '"a"' });

    time = 2_000;
    const second = await source.get();
    expect(second.catalogVersion).toBe('v2');
    expect(second.matcher.match('kale')?.slug).toBe('kale');
    expect(loaded).toEqual(['d6b0257e63c4', 'v2']);
  });

  it('keeps serving the last snapshot when a refresh fails', async () => {
    let time = 0;
    const fetch = fakeFetch([{ status: 200, body: fixture }, { status: 500 }, new Error('ECONNRESET')]);
    const source = createCatalogSource({ catalogUrl: CATALOG_URL, refreshMs: 1, fetch, now: () => time });
    const first = await source.get();
    time = 10;
    expect(await source.get()).toBe(first);
    time = 20;
    expect(await source.get()).toBe(first);
  });

  it('throws when the first load fails', async () => {
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch: fakeFetch([{ status: 503 }]),
    });
    await expect(source.get()).rejects.toThrow();
  });

  it('rejects a malformed catalog on first load', async () => {
    const source = createCatalogSource({
      catalogUrl: CATALOG_URL,
      refreshMs: 1_000,
      fetch: fakeFetch([{ status: 200, body: { nope: true } }]),
    });
    await expect(source.get()).rejects.toThrow();
  });

  it('shares one request between concurrent callers', async () => {
    const fetch = fakeFetch([{ status: 200, body: fixture }]);
    const source = createCatalogSource({ catalogUrl: CATALOG_URL, refreshMs: 1_000, fetch });
    const [a, b, c] = await Promise.all([source.get(), source.get(), source.get()]);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(fetch.calls).toHaveLength(1);
  });
});
