import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type QueryValue = { value: string; multiValue?: { value: string }[] };
type CfRequest = {
  method: string;
  uri: string;
  querystring: Record<string, QueryValue>;
  headers: Record<string, { value: string }>;
};
type CfResponse = {
  statusCode: number;
  statusDescription: string;
  headers?: Record<string, { value: string }>;
};
type Handler = (event: { request: CfRequest }) => Promise<CfRequest | CfResponse>;

// The function is shipped as a plain script with a `cloudfront` import the runtime provides.
// Load it the same way: strip the import and inject a stand-in `cf` with a KeyValueStore.
const source = readFileSync(new URL('./site-viewer-request.js', import.meta.url), 'utf8');
const IMPORT_LINE = "import cf from 'cloudfront';";

function load(store: Record<string, string>): Handler {
  const cf = {
    kvs: () => ({
      get: async (key: string) => {
        if (!(key in store)) throw new Error('KeyValueStore key not found');
        return store[key];
      },
    }),
  };
  const body = source.replace(IMPORT_LINE, '') + '\nreturn handler;';
  return new Function('cf', body)(cf) as Handler;
}

function req(
  uri: string,
  querystring: Record<string, QueryValue> = {},
  host = 'longlivefood.org',
): { request: CfRequest } {
  return { request: { method: 'GET', uri, querystring, headers: { host: { value: host } } } };
}

const handler = load({ current_release: 'r1' });

async function location(event: { request: CfRequest }) {
  const res = (await handler(event)) as CfResponse;
  expect(res.statusCode).toBe(301);
  return res.headers?.location?.value;
}

async function servedUri(event: { request: CfRequest }) {
  const res = (await handler(event)) as CfRequest;
  expect(res).not.toHaveProperty('statusCode');
  return res.uri;
}

describe('site viewer-request function', () => {
  it('ships as a single file with only the cloudfront import', () => {
    expect(source).toContain(IMPORT_LINE);
    expect(source.match(/^\s*import\s/gm)).toHaveLength(1);
    expect(source).not.toMatch(/^\s*export\s/m);
    expect(source).not.toMatch(/\bfor\s*\([^)]*\bof\b/);
  });

  it('passes the API through untouched', async () => {
    expect(await servedUri(req('/api'))).toBe('/api');
    expect(await servedUri(req('/api/extract'))).toBe('/api/extract');
  });

  it('adds the trailing slash and keeps the ?i= query', async () => {
    expect(await location(req('/tool/results', { i: { value: 'abc%20d' } }))).toBe(
      '/tool/results/?i=abc%20d',
    );
  });

  it('keeps repeated and empty query values', async () => {
    const query = {
      i: { value: 'a', multiValue: [{ value: 'a' }, { value: 'b' }] },
      utm_source: { value: '' },
    };
    expect(await location(req('/recipes', query))).toBe('/recipes/?i=a&i=b&utm_source=');
  });

  it('collapses leading slashes so the redirect stays on this host', async () => {
    expect(await location(req('//evil'))).toBe('/evil/');
    expect(await location(req('/\\evil'))).toBe('/evil/');
    expect(await servedUri(req('//evil.example'))).toBe('/releases/r1/evil.example');
  });

  it('sends alternate hosts to the canonical one in a single hop', async () => {
    expect(await location(req('/tips', { i: { value: 'x' } }, 'finishthefridge.org'))).toBe(
      'https://longlivefood.org/tips/?i=x',
    );
    expect(await location(req('/', {}, 'www.longlivefood.org'))).toBe('https://longlivefood.org/');
    expect(await location(req('/a.png', {}, 'WWW.FinishTheFridge.com'))).toBe(
      'https://longlivefood.org/a.png',
    );
  });

  it('does not redirect other environments', async () => {
    expect(await servedUri(req('/', {}, 'staging.longlivefood.org'))).toBe(
      '/releases/r1/index.html',
    );
  });

  it('maps pages and assets into the current release', async () => {
    expect(await servedUri(req('/'))).toBe('/releases/r1/index.html');
    expect(await servedUri(req('/about/'))).toBe('/releases/r1/about/index.html');
    expect(await servedUri(req('/_next/static/app.js'))).toBe('/releases/r1/_next/static/app.js');
  });

  it('returns 503 when the release pointer is missing or unsafe', async () => {
    const stores: Record<string, string>[] = [
      {},
      { current_release: '../secrets' },
      { current_release: '' },
    ];
    for (const store of stores) {
      const res = (await load(store)(req('/'))) as CfResponse;
      expect(res.statusCode).toBe(503);
    }
  });
});
