import type { RelayConfig } from './config';
import type { ProxyLog } from './log';

export type RelayDeps = {
  config: RelayConfig;
  fetch?: typeof fetch;
  now?: () => Date;
  log?: (fields: ProxyLog) => void;
};

export const RELAY_PATH = /^\/v1beta\/models\/([A-Za-z0-9._-]+):generateContent$/;

export function json(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { code: status, message } }), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/**
 * Relay mode (was `llf-gemini-relay-dev`, D38): a developer's local `find-my-tips` sets
 * `GEMINI_BASE_URL` to this service and sends their token as the Gemini key. The caller is
 * already authenticated; this swaps in ddd's dev key and forwards `generateContent` only, for
 * allow-listed models, under a shared daily cap. Never on staging or prod (D37).
 */
export function createRelay(deps: RelayDeps) {
  const { config } = deps;
  const doFetch = deps.fetch ?? fetch;
  const now = deps.now ?? (() => new Date());
  const log = deps.log ?? (() => {});
  const models = new Set(config.models);
  let day = '';
  let calls = 0;

  function reject(status: number, reason: string, message: string, caller: number, model?: string) {
    log({ event: 'reject', route: 'relay', status, reason, caller, ...(model ? { model } : {}) });
    return json(status, message);
  }

  return async function handle(request: Request, caller: number): Promise<Response> {
    const match = RELAY_PATH.exec(new URL(request.url).pathname);
    if (!match) return reject(404, 'path', 'not found', caller);
    if (request.method !== 'POST') return reject(405, 'method', 'method not allowed', caller);

    const model = match[1]!;
    if (!models.has(model)) return reject(403, 'model', 'model not allowed', caller, model);

    const body = await request.arrayBuffer();
    if (body.byteLength > config.bodyMaxBytes) {
      return reject(413, 'size', 'request too large', caller, model);
    }

    const today = now().toISOString().slice(0, 10);
    if (today !== day) {
      day = today;
      calls = 0;
    }
    if (calls >= config.dailyCalls) {
      return reject(429, 'quota', 'daily relay quota used', caller, model);
    }
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
        event: 'request',
        route: 'relay',
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
        route: 'relay',
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
  };
}
