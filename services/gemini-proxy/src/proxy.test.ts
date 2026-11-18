import type { AddressInfo } from 'node:net';

import {
  createApp,
  createCatalogSource,
  createMockProvider,
  MemoryCacheStore,
  MemoryCounterStore,
  silentLogger,
} from '@llf/find-my-tips';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createProxyApp } from './app';
import { loadConfig, type Config } from './config';
import type { ProxyLog } from './log';

const TOKEN_A = 'proxy-token-a-0123456789abcdef';
const TOKEN_B = 'proxy-token-b-0123456789abcdef';
const KEY = 'g-real-dev-key';
const RELAY = '/v1beta/models/gemini-3.8-flash:generateContent';

const baseEnv = {
  GEMINI_API_KEY: KEY,
  PROXY_TOKENS: TOKEN_A,
  RELAY_TOKENS: TOKEN_B,
  AI_PROVIDER: 'mock',
  RELAY_DAILY_CALLS: '2',
  RELAY_BODY_MAX_BYTES: '64',
  RELAY_TIMEOUT_MS: '50',
};

const servers: { close(): void }[] = [];
afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

async function start(
  options: { env?: Record<string, string>; fetch?: typeof fetch; now?: () => Date } = {},
) {
  const config: Config = loadConfig({ ...baseEnv, ...options.env });
  const tool = createApp({
    config: config.tool,
    catalog: createCatalogSource({ refreshMs: 60_000 }),
    provider: createMockProvider(),
    cache: new MemoryCacheStore(),
    counters: new MemoryCounterStore(),
    logger: silentLogger,
  });
  const lines: ProxyLog[] = [];
  const upstream =
    options.fetch ?? vi.fn(async () => new Response('{"candidates":[]}', { status: 200 }));
  const app = createProxyApp({
    config,
    tool,
    fetch: upstream,
    ...(options.now ? { now: options.now } : {}),
    log: (fields) => lines.push(fields),
  });
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { base, upstream, lines };
}

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
const extract = (base: string, headers: Record<string, string>, text = 'milk, eggs, spinach') =>
  fetch(`${base}/api/find-tips/extract`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ inputType: 'text', text }),
  });

describe('config', () => {
  it('needs the dev key and at least one long token, from either variable', () => {
    expect(() => loadConfig({ PROXY_TOKENS: TOKEN_A })).toThrow(/GEMINI_API_KEY/);
    expect(() => loadConfig({ GEMINI_API_KEY: KEY })).toThrow(/PROXY_TOKENS/);
    expect(() => loadConfig({ GEMINI_API_KEY: KEY, PROXY_TOKENS: 'short' })).toThrow(
      /PROXY_TOKENS/,
    );
    expect(loadConfig(baseEnv).tokens).toEqual([TOKEN_A, TOKEN_B]);
  });

  it('defaults the tool to the arena pick: Gemini 3.8 Flash, p3, thinking off', () => {
    const { tool } = loadConfig({ GEMINI_API_KEY: KEY, PROXY_TOKENS: TOKEN_A });
    expect(tool).toMatchObject({
      provider: 'gemini',
      model: 'gemini-3.8-flash',
      promptVersion: 'p3',
      reasoningEffort: 'none',
    });
  });

  it('refuses any provider but Gemini (or mock)', () => {
    expect(() => loadConfig({ ...baseEnv, AI_PROVIDER: 'openai' })).toThrow(/must be gemini/);
  });

  it('never points the tool back at a proxy', () => {
    const { tool } = loadConfig({
      ...baseEnv,
      GEMINI_BASE_URL: 'https://elsewhere.example',
      GEMINI_PROXY_URL: 'https://proxy.example',
      GEMINI_PROXY_TOKEN: TOKEN_A,
    });
    expect(tool.geminiBaseUrl).toBeUndefined();
  });

  it('never echoes secrets on errors', () => {
    expect(() => loadConfig({ ...baseEnv, PORT: 'x' })).not.toThrow(
      new RegExp(`${KEY}|${TOKEN_A}`),
    );
  });
});

describe('proxy', () => {
  it('answers the health check without a token', async () => {
    const { base } = await start();
    expect((await fetch(`${base}/healthz`)).status).toBe(200);
  });

  it('rejects a missing or wrong token on every other route', async () => {
    const { base, upstream } = await start();
    expect((await extract(base, {})).status).toBe(401);
    expect((await extract(base, bearer('wrong-token-0123456789abcdef'))).status).toBe(401);
    expect((await extract(base, bearer(KEY))).status).toBe(401);
    expect((await fetch(`${base}${RELAY}`, { method: 'POST', body: '{}' })).status).toBe(401);
    expect((await fetch(`${base}/api/find-tips/status`)).status).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('serves the full tool API with either header form', async () => {
    const { base } = await start();
    const status = await fetch(`${base}/api/find-tips/status`, { headers: bearer(TOKEN_A) });
    expect(status.status).toBe(200);
    expect(await status.json()).toMatchObject({ mode: 'live' });

    for (const headers of [bearer(TOKEN_A), { 'x-goog-api-key': TOKEN_B }]) {
      const res = await extract(base, headers);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { matches: { slug: string }[]; unmatchedCount: number };
      expect(body.matches.map((m) => m.slug)).toEqual(expect.arrayContaining(['milk', 'spinach']));
      expect(typeof body.unmatchedCount).toBe('number');
    }
  });

  it('passes the tool error contract through unchanged', async () => {
    const { base } = await start();
    const res = await fetch(`${base}/api/find-tips/extract`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...bearer(TOKEN_A) },
      body: '{"inputType":"nope"}',
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'invalid_request' });
  });

  it('relays generateContent with the dev key swapped in', async () => {
    const { base, upstream } = await start();
    const res = await fetch(`${base}${RELAY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': TOKEN_B },
      body: '{"contents":[]}',
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('{"candidates":[]}');
    const [url, init] = vi.mocked(upstream).mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
    );
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(KEY);
  });

  it('only relays allow-listed models, within size and the daily cap', async () => {
    let now = new Date('2026-11-17T10:00:00Z');
    const { base } = await start({ now: () => now });
    const relay = (path: string, body = '{}') =>
      fetch(`${base}${path}`, { method: 'POST', headers: bearer(TOKEN_A), body });

    expect((await relay('/v1beta/models/gemini-3.8-pro:generateContent')).status).toBe(403);
    expect((await relay(RELAY, 'x'.repeat(65))).status).toBe(413);
    expect((await relay(RELAY)).status).toBe(200);
    expect((await relay(RELAY)).status).toBe(200);
    expect((await relay(RELAY)).status).toBe(429);
    now = new Date('2026-11-18T00:00:01Z');
    expect((await relay(RELAY)).status).toBe(200);
  });

  it('returns 502 or 504 when Google fails or is slow', async () => {
    const down = await start({
      fetch: vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    });
    const r1 = await fetch(`${down.base}${RELAY}`, {
      method: 'POST',
      headers: bearer(TOKEN_A),
      body: '{}',
    });
    expect(r1.status).toBe(502);

    const slow = await start({
      fetch: ((_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        })) as unknown as typeof fetch,
    });
    const r2 = await fetch(`${slow.base}${RELAY}`, {
      method: 'POST',
      headers: bearer(TOKEN_A),
      body: '{}',
    });
    expect(r2.status).toBe(504);
  });

  it('answers unknown paths with 404 after auth', async () => {
    const { base } = await start();
    expect((await fetch(`${base}/elsewhere`, { headers: bearer(TOKEN_A) })).status).toBe(404);
  });

  it('logs callers by position only: no tokens, keys, or bodies', async () => {
    const { base, lines } = await start();
    await extract(base, bearer(TOKEN_B), 'secret user text');
    await fetch(`${base}${RELAY}`, {
      method: 'POST',
      headers: bearer(TOKEN_A),
      body: '{"q":"more user text"}',
    });
    await extract(base, {});
    const logged = JSON.stringify(lines);
    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ route: 'tool', status: 200, caller: 1 }),
        expect.objectContaining({ route: 'relay', status: 200, caller: 0 }),
        expect.objectContaining({ status: 401, reason: 'token' }),
      ]),
    );
    for (const secret of [KEY, TOKEN_A, TOKEN_B, 'secret user text', 'more user text']) {
      expect(logged).not.toContain(secret);
    }
  });
});
