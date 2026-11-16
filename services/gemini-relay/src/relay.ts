import { createHash, timingSafeEqual } from 'node:crypto';

import type { Config } from './config';

/**
 * Allow-listed log fields (D20). Request and response bodies, tokens, and keys never appear
 * here; a caller is identified only by the position of their token in RELAY_TOKENS.
 */
export type RelayLog = {
  event: 'relay' | 'reject' | 'start';
  status?: number;
  reason?: string;
  model?: string;
  caller?: number;
  latencyMs?: number;
  port?: number;
};

export type RelayDeps = {
  config: Config;
  fetch?: typeof fetch;
  now?: () => Date;
  log?: (fields: RelayLog) => void;
};

const PATH = /^\/v1beta\/models\/([A-Za-z0-9._-]+):generateContent$/;

const digest = (value: string) => createHash('sha256').update(value).digest();

function json(status: number, error: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: { code: status, message: error } }), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra },
  });
}

/**
 * Dev-only Gemini relay (TDD D38). Developers in mainland China can't reach Google, so the
 * tool's Gemini adapter points here with `GEMINI_BASE_URL` and sends a relay token as its key.
 * The relay checks the token, swaps in ddd's dev key, and forwards `generateContent` only.
 * Never deployed to staging or prod: those call Gemini directly from AWS (D37).
 */
export function createRelay(deps: RelayDeps): { handle(request: Request): Promise<Response> } {
  const { config } = deps;
  const doFetch = deps.fetch ?? fetch;
  const now = deps.now ?? (() => new Date());
  const log = deps.log ?? (() => {});
  const tokenDigests = config.tokens.map(digest);
  const models = new Set(config.models);
  let day = '';
  let calls = 0;

  function callerFor(token: string | null): number | undefined {
    if (!token) return undefined;
    const candidate = digest(token);
    let match: number | undefined;
    // Compare against every token so timing doesn't reveal which one nearly matched.
    tokenDigests.forEach((known, index) => {
      if (timingSafeEqual(known, candidate) && match === undefined) match = index;
    });
    return match;
  }

  function reject(status: number, reason: string, message: string, model?: string): Response {
    log({ event: 'reject', status, reason, ...(model ? { model } : {}) });
    return json(status, message);
  }

  return {
    async handle(request) {
      const url = new URL(request.url);
      if (request.method === 'GET' && url.pathname === '/healthz') {
        return new Response('ok', { headers: { 'cache-control': 'no-store' } });
      }

      const match = PATH.exec(url.pathname);
      if (!match) return reject(404, 'path', 'not found');
      if (request.method !== 'POST') return reject(405, 'method', 'method not allowed');

      const caller = callerFor(request.headers.get('x-goog-api-key'));
      if (caller === undefined) return reject(401, 'token', 'invalid relay token');

      const model = match[1]!;
      if (!models.has(model)) return reject(403, 'model', 'model not allowed', model);

      const length = Number(request.headers.get('content-length') ?? '0');
      if (length > config.bodyMaxBytes) return reject(413, 'size', 'request too large', model);
      const body = await request.arrayBuffer();
      if (body.byteLength > config.bodyMaxBytes) {
        return reject(413, 'size', 'request too large', model);
      }

      const today = now().toISOString().slice(0, 10);
      if (today !== day) {
        day = today;
        calls = 0;
      }
      if (calls >= config.dailyCalls) return reject(429, 'quota', 'daily relay quota used', model);
      calls += 1;

      const started = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const upstream = await doFetch(
          `${config.upstream}/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: 'POST',
            headers: { 'x-goog-api-key': config.geminiApiKey, 'content-type': 'application/json' },
            body,
            signal: controller.signal,
          },
        );
        const text = await upstream.text();
        log({
          event: 'relay',
          status: upstream.status,
          model,
          caller,
          latencyMs: Date.now() - started,
        });
        return new Response(text, {
          status: upstream.status,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        });
      } catch {
        const timedOut = controller.signal.aborted;
        log({
          event: 'reject',
          status: timedOut ? 504 : 502,
          reason: timedOut ? 'timeout' : 'upstream',
          model,
          caller,
          latencyMs: Date.now() - started,
        });
        return json(timedOut ? 504 : 502, timedOut ? 'upstream timed out' : 'upstream failed');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
