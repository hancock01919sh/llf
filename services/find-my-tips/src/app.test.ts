import { readFileSync } from 'node:fs';

import {
  BODY_MAX_BYTES,
  ErrorResponse,
  ExtractResponse,
  FIND_TIPS_API,
  StatusResponse,
} from '@llf/contracts/find-tips';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from './app';
import type { AppDeps } from './app';
import { MemoryCacheStore, MemoryCounterStore } from './cache';
import { staticCatalogSource } from './catalog';
import type { CatalogSource } from './catalog';
import { loadConfig } from './config';
import { createMockProvider } from './extract';
import type { ExtractionProvider } from './extract';
import type { LogFields } from './log';
import { PUBLIC_IP, fakeResolver, fakeTransport, recipePage } from './test-utils';

const fixture: unknown = JSON.parse(
  readFileSync(new URL('./fixtures/catalog.json', import.meta.url), 'utf8'),
);
const catalog = staticCatalogSource(fixture as Parameters<typeof staticCatalogSource>[0]);

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const b64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');

const SECRET_TEXT = 'milk, spinach, mystery';
const RECIPE_URL = 'https://recipes.test/pie';

function makeApp(env: Record<string, string> = {}, extra: Partial<AppDeps> = {}) {
  const logs: LogFields[] = [];
  const app = createApp({
    config: loadConfig(env),
    catalog,
    provider: createMockProvider(),
    cache: new MemoryCacheStore(),
    counters: new MemoryCounterStore(),
    logger: (fields) => logs.push(fields),
    resolve: fakeResolver({ 'recipes.test': [PUBLIC_IP], 'internal.test': ['10.0.0.8'] }),
    transport: fakeTransport({
      [RECIPE_URL]: { html: recipePage(['2 cups whole milk', '1 bag baby spinach']) },
    }),
    newRequestId: () => 'req-1',
    ...extra,
  });
  return { app, logs };
}

const base = 'http://localhost';

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(base + FIND_TIPS_API.extract, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function errorCode(response: Response): Promise<string> {
  return ErrorResponse.parse(await response.json()).code;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('status endpoint', () => {
  it('reports mode and catalog version', async () => {
    const { app } = makeApp();
    const res = await app.handle(new Request(base + FIND_TIPS_API.status));
    expect(res.status).toBe(200);
    expect(StatusResponse.parse(await res.json())).toEqual({
      mode: 'live',
      catalogVersion: 'd6b0257e63c4',
    });
    expect(res.headers.get('x-request-id')).toBe('req-1');
  });

  it('answers HEAD and reflects the kill switch', async () => {
    const { app } = makeApp({ FIND_TIPS_MODE: 'jsonld-only' });
    expect(
      (await app.handle(new Request(base + FIND_TIPS_API.status, { method: 'HEAD' }))).status,
    ).toBe(200);
    const res = await app.handle(new Request(base + FIND_TIPS_API.status));
    expect(StatusResponse.parse(await res.json()).mode).toBe('jsonld-only');
  });

  it('rejects other methods with an allow header', async () => {
    const { app } = makeApp();
    const res = await app.handle(new Request(base + FIND_TIPS_API.status, { method: 'POST' }));
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, HEAD');
    expect(await errorCode(res)).toBe('method_not_allowed');
  });

  it('turns an unexpected failure into a 500 without leaking details', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken: CatalogSource = {
      get: () => Promise.reject(new Error('db password in message')),
    };
    const { app } = makeApp({}, { catalog: broken });
    const res = await app.handle(new Request(base + FIND_TIPS_API.status));
    expect(res.status).toBe(500);
    const body: unknown = await res.json();
    expect(body).toEqual({ requestId: 'req-1', code: 'server' });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('db password');
  });
});

describe('routing', () => {
  it('404s unknown paths', async () => {
    const { app } = makeApp();
    const res = await app.handle(new Request(`${base}/api/find-tips/nope`));
    expect(res.status).toBe(404);
    expect(await errorCode(res)).toBe('not_found');
  });

  it('only accepts POST on extract', async () => {
    const { app } = makeApp();
    const res = await app.handle(new Request(base + FIND_TIPS_API.extract));
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST');
  });
});

describe('extract: happy paths', () => {
  it('extracts typed text and matches it against the catalog', async () => {
    const { app } = makeApp();
    const res = await app.handle(post({ inputType: 'text', text: SECRET_TEXT }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-request-id')).toBe('req-1');
    const body = ExtractResponse.parse(await res.json());
    expect(body).toMatchObject({
      requestId: 'req-1',
      detectedType: 'shopping_list',
      readable: true,
      source: 'model',
      unmatchedCount: 1,
      catalogVersion: 'd6b0257e63c4',
    });
    expect(body.matches.map((m) => m.slug).sort()).toEqual(['milk', 'spinach']);
  });

  it('extracts an image', async () => {
    const { app } = makeApp();
    const res = await app.handle(
      post({ inputType: 'image', imageBase64: b64(PNG), mimeType: 'image/png' }),
    );
    expect(res.status).toBe(200);
    const body = ExtractResponse.parse(await res.json());
    expect(body.detectedType).toBe('fridge_photo');
    expect(body.source).toBe('model');
    expect(body.matches.map((m) => m.slug)).toEqual(
      expect.arrayContaining(['milk', 'spinach', 'banana']),
    );
  });

  it('reads JSON-LD from a recipe URL, then serves the repeat from cache', async () => {
    const { app } = makeApp();
    const first = ExtractResponse.parse(
      await (await app.handle(post({ inputType: 'url', url: RECIPE_URL }))).json(),
    );
    expect(first.source).toBe('jsonld');
    expect(first.detectedType).toBe('recipe');
    expect(first.matches.map((m) => m.slug).sort()).toEqual(['milk', 'spinach']);

    const second = ExtractResponse.parse(
      await (await app.handle(post({ inputType: 'url', url: RECIPE_URL }))).json(),
    );
    expect(second.source).toBe('cache');
    expect(second.matches).toEqual(first.matches);
  });

  it('never logs user input', async () => {
    const { app, logs } = makeApp();
    await app.handle(post({ inputType: 'text', text: SECRET_TEXT }));
    await app.handle(post({ inputType: 'url', url: RECIPE_URL }));
    await app.handle(post({ inputType: 'text', text: '' }));
    const logged = JSON.stringify(logs);
    expect(logs.length).toBe(3);
    expect(logged).not.toContain('mystery');
    expect(logged).not.toContain('recipes.test');
    expect(logged).not.toContain('spinach');
  });

  it('classifies unmatched terms only when enabled and never logs their names', async () => {
    const mock = createMockProvider();
    const provider: ExtractionProvider = {
      ...mock,
      classifyGaps: async (terms) => ({
        result: { items: terms.map(() => ({ name: 'dragonfruit', class: 'edible' })) },
      }),
    };
    const { app, logs } = makeApp({ GAP_LOG: 'on' }, { provider });
    const res = await app.handle(post({ inputType: 'text', text: 'milk, mystery' }));
    const body = ExtractResponse.parse(await res.json());
    expect(body.gaps).toEqual([{ name: 'dragonfruit', class: 'edible' }]);
    expect(body.matches.map((item) => item.slug)).toContain('milk');
    expect(JSON.stringify(logs)).not.toContain('dragonfruit');
  });

  it('returns the normal result when gap classification fails', async () => {
    const mock = createMockProvider();
    const provider: ExtractionProvider = {
      ...mock,
      classifyGaps: async () => {
        throw new Error('private term should not be logged');
      },
    };
    const { app, logs } = makeApp({  GAP_LOG: 'on' }, { provider });
    const res = await app.handle(post({ inputType: 'text', text: 'milk, secret-term' }));
    const body = ExtractResponse.parse(await res.json());
    expect(res.status).toBe(200);
    expect(body.matches.map((item) => item.slug)).toContain('milk');
    expect(body.unmatchedCount).toBe(1);
    expect(body.gaps).toEqual([]);
    expect(JSON.stringify(logs)).not.toContain('secret-term');
  });
});

describe('extract: request validation', () => {
  it('415s a non-JSON content type', async () => {
    const { app } = makeApp();
    const res = await app.handle(
      post({ inputType: 'text', text: 'milk' }, { 'content-type': 'text/plain' }),
    );
    expect(res.status).toBe(415);
    expect(await errorCode(res)).toBe('unsupported_media_type');
  });

  it('413s an oversized body', async () => {
    const { app } = makeApp();
    const text = 'a'.repeat(BODY_MAX_BYTES + 1);
    const res = await app.handle(post({ inputType: 'text', text }));
    expect(res.status).toBe(413);
    expect(await errorCode(res)).toBe('too_large');
  });

  it('400s malformed JSON and schema failures', async () => {
    const { app } = makeApp();
    expect((await app.handle(post('{not json'))).status).toBe(400);
    const res = await app.handle(post({ inputType: 'video', url: RECIPE_URL }));
    expect(res.status).toBe(400);
    expect(await errorCode(res)).toBe('invalid_request');
  });

  it('415s an image whose bytes do not match the declared type', async () => {
    const { app } = makeApp();
    const res = await app.handle(
      post({ inputType: 'image', imageBase64: b64(PNG), mimeType: 'image/jpeg' }),
    );
    expect(res.status).toBe(415);
  });

  it('422s a URL that resolves to a private address', async () => {
    const { app } = makeApp();
    const res = await app.handle(post({ inputType: 'url', url: 'https://internal.test/x' }));
    expect(res.status).toBe(422);
    expect(await errorCode(res)).toBe('url_not_allowed');
  });
});

describe('extract: guards', () => {
  it('503s everything when the tool is off', async () => {
    const { app } = makeApp({ FIND_TIPS_MODE: 'off' });
    const res = await app.handle(post({ inputType: 'url', url: RECIPE_URL }));
    expect(res.status).toBe(503);
    expect(await errorCode(res)).toBe('unavailable');
  });

  it('only serves URLs in jsonld-only mode', async () => {
    const { app } = makeApp({ FIND_TIPS_MODE: 'jsonld-only' });
    expect((await app.handle(post({ inputType: 'text', text: 'milk' }))).status).toBe(503);
    expect((await app.handle(post({ inputType: 'url', url: RECIPE_URL }))).status).toBe(200);
  });

  it('503s model calls once the daily quota is spent', async () => {
    const { app } = makeApp({ QUOTA_DAILY_MODEL_CALLS: '1' });
    expect((await app.handle(post({ inputType: 'text', text: 'milk' }))).status).toBe(200);
    const res = await app.handle(post({ inputType: 'text', text: 'milk' }));
    expect(res.status).toBe(503);
    expect(await errorCode(res)).toBe('unavailable');
  });

  it('429s with retry-after when the per-IP limit is hit', async () => {
    const { app } = makeApp({ RATE_LIMIT_MODEL: '1' });
    expect(
      (await app.handle(post({ inputType: 'text', text: 'milk' }), { ip: '203.0.113.9' })).status,
    ).toBe(200);
    const res = await app.handle(post({ inputType: 'text', text: 'milk' }), { ip: '203.0.113.9' });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(await errorCode(res)).toBe('rate_limited');
    // A different client is unaffected.
    expect(
      (await app.handle(post({ inputType: 'text', text: 'milk' }), { ip: '203.0.113.10' })).status,
    ).toBe(200);
  });

  it('504s when the handler deadline passes', async () => {
    const hanging: ExtractionProvider = {
      name: 'hanging',
      extract: (_input, ctx) =>
        new Promise((_, reject) => {
          ctx.signal.addEventListener('abort', () => reject(ctx.signal.reason as Error));
        }),
    };
    const { app } = makeApp(
      { HANDLER_TIMEOUT_MS: '20', MODEL_TIMEOUT_MS: '60000' },
      { provider: hanging },
    );
    const res = await app.handle(post({ inputType: 'text', text: 'milk' }));
    expect(res.status).toBe(504);
    expect(await errorCode(res)).toBe('timeout');
  });
});
