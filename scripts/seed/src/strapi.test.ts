import { describe, expect, it } from 'vitest';

import { createStrapiClient, StrapiError, toQuery, type Fetch } from './strapi';

const TOKEN = 'test-token';

interface Sent {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

function mockFetch(
  respond: (sent: Sent) => Response = () => json({ data: { documentId: 'doc-1' } }),
) {
  const sent: Sent[] = [];
  const fetch: Fetch = (input, init = {}) => {
    const call: Sent = {
      url: input,
      method: init.method ?? 'GET',
      headers: init.headers as Record<string, string>,
      ...(typeof init.body === 'string' ? { body: JSON.parse(init.body) as unknown } : {}),
    };
    sent.push(call);
    return Promise.resolve(respond(call));
  };
  return { fetch, sent };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const client = (fetch: Fetch) =>
  createStrapiClient({ url: 'http://cms.test/', token: TOKEN, fetch });

describe('toQuery', () => {
  it('flattens nested params into bracketed, encoded keys', () => {
    expect(
      toQuery({ status: 'draft', filters: { title: { $eq: 'A & B' } }, pagination: { page: 2 } }),
    ).toEqual([
      'status=draft',
      `${encodeURIComponent('filters[title][$eq]')}=A%20%26%20B`,
      `${encodeURIComponent('pagination[page]')}=2`,
    ]);
  });

  it('handles arrays and booleans the way Strapi expects', () => {
    expect(toQuery({ populate: ['a', 'b'], on: true })).toEqual([
      `${encodeURIComponent('populate[0]')}=a`,
      `${encodeURIComponent('populate[1]')}=b`,
      'on=true',
    ]);
  });
});

describe('createStrapiClient', () => {
  it('authenticates every request and only sends a content type with a body', async () => {
    const { fetch, sent } = mockFetch((call) =>
      call.method === 'GET' ? json({ data: [] }) : json({ data: { documentId: 'doc-1' } }),
    );
    const api = client(fetch);

    await api.find('tips', 'title', 'x');
    await api.create('tips', { title: 'x' });

    expect(sent.map((call) => call.headers.Authorization)).toEqual([
      `Bearer ${TOKEN}`,
      `Bearer ${TOKEN}`,
    ]);
    expect(sent.map((call) => call.headers.Accept)).toEqual([
      'application/json',
      'application/json',
    ]);
    expect(sent[0]?.headers['Content-Type']).toBeUndefined();
    expect(sent[0]?.body).toBeUndefined();
    expect(sent[1]?.headers['Content-Type']).toBe('application/json');
  });

  it('find looks across drafts and published by an exact field match', async () => {
    const { fetch, sent } = mockFetch(() =>
      json({ data: [{ documentId: 'doc-7', title: 'Freeze ripe bananas' }] }),
    );

    await expect(client(fetch).find('tips', 'title', 'Freeze ripe bananas')).resolves.toEqual({
      documentId: 'doc-7',
      title: 'Freeze ripe bananas',
    });
    const url = new URL(sent[0]?.url ?? '');
    expect(url.origin + url.pathname).toBe('http://cms.test/api/tips');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      status: 'draft',
      'filters[title][$eq]': 'Freeze ripe bananas',
      'pagination[pageSize]': '2',
    });
  });

  it('find returns undefined when nothing matches and refuses to guess between duplicates', async () => {
    await expect(
      client(mockFetch(() => json({ data: [] })).fetch).find('tips', 'title', 'x'),
    ).resolves.toBeUndefined();

    const duplicate = mockFetch(() => json({ data: [{ documentId: 'a' }, { documentId: 'b' }] }));
    const error = await client(duplicate.fetch)
      .find('tips', 'title', 'x')
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StrapiError);
    expect((error as StrapiError).status).toBe(0);
  });

  it('create POSTs a published document wrapped in { data }', async () => {
    const { fetch, sent } = mockFetch();

    await expect(client(fetch).create('tips', { title: 'x' })).resolves.toEqual({
      documentId: 'doc-1',
    });
    expect(sent[0]).toMatchObject({
      method: 'POST',
      url: 'http://cms.test/api/tips?status=published',
      body: { data: { title: 'x' } },
    });
  });

  it('update PUTs to the encoded document id', async () => {
    const { fetch, sent } = mockFetch();

    await client(fetch).update('pages', 'a/b c', { main: [] });
    expect(sent[0]).toMatchObject({
      method: 'PUT',
      url: 'http://cms.test/api/pages/a%2Fb%20c?status=published',
      body: { data: { main: [] } },
    });
  });

  it('list returns the data and page count, defaulting to one page', async () => {
    const paged = mockFetch(() =>
      json({ data: [{ id: 1 }], meta: { pagination: { pageCount: 3 } } }),
    );
    await expect(client(paged.fetch).list('tips', { pagination: { page: 1 } })).resolves.toEqual({
      data: [{ id: 1 }],
      pageCount: 3,
    });
    expect(paged.sent[0]?.url).toBe(
      `http://cms.test/api/tips?${encodeURIComponent('pagination[page]')}=1`,
    );

    const bare = mockFetch(() => json({}));
    await expect(client(bare.fetch).list('tips', {})).resolves.toEqual({ data: [], pageCount: 1 });
  });

  it('turns HTTP failures into a StrapiError carrying the status', async () => {
    const { fetch } = mockFetch(
      () => new Response('{"error":{"message":"Invalid key title"}}', { status: 400 }),
    );

    const error = await client(fetch)
      .create('tips', { title: 'x' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StrapiError);
    expect((error as StrapiError).status).toBe(400);
    expect((error as StrapiError).message).toBe(
      'POST /api/tips?status=published failed: 400 {"error":{"message":"Invalid key title"}}',
    );
    expect((error as StrapiError).message).not.toContain(TOKEN);
  });

  it('rejects a write response without a documentId', async () => {
    const { fetch } = mockFetch(() => json({ data: { id: 1 } }));

    await expect(client(fetch).create('tips', { title: 'x' })).rejects.toThrow(
      'Strapi response has no data.documentId',
    );
  });
});
