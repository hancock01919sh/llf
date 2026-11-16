import { describe, expect, it, vi } from 'vitest';

import { loadConfig, type Config } from './config';
import { createRelay, type RelayLog } from './relay';

const TOKEN_A = 'relay-token-a-0123456789abcdef';
const TOKEN_B = 'relay-token-b-0123456789abcdef';
const KEY = 'g-real-dev-key';
const BASE = 'https://relay.test';
const PATH = '/v1beta/models/gemini-3.8-flash:generateContent';

const config: Config = loadConfig({
  GEMINI_API_KEY: KEY,
  RELAY_TOKENS: `${TOKEN_A}, ${TOKEN_B}`,
  RELAY_DAILY_CALLS: '2',
  RELAY_BODY_MAX_BYTES: '64',
  RELAY_TIMEOUT_MS: '50',
});

function upstreamOk() {
  return vi.fn(async () => new Response('{"candidates":[]}', { status: 200 }));
}

function post(path = PATH, token: string | null = TOKEN_A, body = '{"contents":[]}') {
  return new Request(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { 'x-goog-api-key': token } : {}) },
    body,
  });
}

describe('loadConfig', () => {
  it('needs the dev key and at least one long token', () => {
    expect(() => loadConfig({ RELAY_TOKENS: TOKEN_A })).toThrow(/GEMINI_API_KEY/);
    expect(() => loadConfig({ GEMINI_API_KEY: KEY })).toThrow(/RELAY_TOKENS/);
    expect(() => loadConfig({ GEMINI_API_KEY: KEY, RELAY_TOKENS: 'short' })).toThrow(
      /RELAY_TOKENS/,
    );
  });

  it('never echoes secrets on errors', () => {
    expect(() => loadConfig({ GEMINI_API_KEY: KEY, RELAY_TOKENS: TOKEN_A, PORT: 'x' })).not.toThrow(
      new RegExp(`${KEY}|${TOKEN_A}`),
    );
  });

  it('defaults to one flash model and the Google endpoint', () => {
    const c = loadConfig({ GEMINI_API_KEY: KEY, RELAY_TOKENS: TOKEN_A });
    expect(c.models).toEqual(['gemini-3.8-flash']);
    expect(c.upstream).toBe('https://generativelanguage.googleapis.com');
    expect(c.tokens).toEqual([TOKEN_A]);
  });
});

describe('relay', () => {
  it('swaps the relay token for the dev key and forwards generateContent', async () => {
    const fetch = upstreamOk();
    const relay = createRelay({ config, fetch });
    const res = await relay.handle(post());
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('{"candidates":[]}');
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
    );
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(KEY);
  });

  it('passes upstream errors through with their status', async () => {
    const fetch = vi.fn(async () => new Response('{"error":{}}', { status: 429 }));
    const res = await createRelay({ config, fetch }).handle(post());
    expect(res.status).toBe(429);
  });

  it('rejects a missing or wrong token without calling Google', async () => {
    const fetch = upstreamOk();
    const relay = createRelay({ config, fetch });
    expect((await relay.handle(post(PATH, null))).status).toBe(401);
    expect((await relay.handle(post(PATH, 'wrong-token-0123456789abcdef'))).status).toBe(401);
    expect((await relay.handle(post(PATH, KEY))).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('only relays generateContent for allowed models', async () => {
    const fetch = upstreamOk();
    const relay = createRelay({ config, fetch });
    expect((await relay.handle(post('/v1beta/models/gemini-3.8-pro:generateContent'))).status).toBe(
      403,
    );
    expect((await relay.handle(post('/v1beta/models'))).status).toBe(404);
    expect(
      (await relay.handle(post('/v1beta/models/gemini-3.8-flash:streamGenerateContent'))).status,
    ).toBe(404);
    expect(
      (
        await relay.handle(
          new Request(`${BASE}${PATH}`, { headers: { 'x-goog-api-key': TOKEN_A } }),
        )
      ).status,
    ).toBe(405);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('answers the health check without a token', async () => {
    const res = await createRelay({ config }).handle(new Request(`${BASE}/healthz`));
    expect(res.status).toBe(200);
  });

  it('rejects bodies over the limit', async () => {
    const fetch = upstreamOk();
    const res = await createRelay({ config, fetch }).handle(post(PATH, TOKEN_A, 'x'.repeat(65)));
    expect(res.status).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('stops at the daily cap and resets the next UTC day', async () => {
    const fetch = upstreamOk();
    let now = new Date('2026-11-12T10:00:00Z');
    const relay = createRelay({ config, fetch, now: () => now });
    expect((await relay.handle(post())).status).toBe(200);
    expect((await relay.handle(post(PATH, TOKEN_B))).status).toBe(200);
    expect((await relay.handle(post())).status).toBe(429);
    now = new Date('2026-11-13T00:00:01Z');
    expect((await relay.handle(post())).status).toBe(200);
  });

  it('times out slow upstream calls', async () => {
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const res = await createRelay({
      config,
      fetch: fetch as unknown as typeof globalThis.fetch,
    }).handle(post());
    expect(res.status).toBe(504);
  });

  it('returns 502 when Google is unreachable', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    expect((await createRelay({ config, fetch }).handle(post())).status).toBe(502);
  });

  it('logs no tokens, keys or bodies', async () => {
    const lines: RelayLog[] = [];
    const relay = createRelay({ config, fetch: upstreamOk(), log: (f) => lines.push(f) });
    await relay.handle(post(PATH, TOKEN_B, '{"secret":"user text"}'));
    await relay.handle(post(PATH, null));
    const logged = JSON.stringify(lines);
    expect(lines[0]).toMatchObject({ event: 'relay', status: 200, caller: 1 });
    for (const secret of [KEY, TOKEN_A, TOKEN_B, 'user text', 'candidates']) {
      expect(logged).not.toContain(secret);
    }
  });
});
