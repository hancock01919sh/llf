import { readFile } from 'node:fs/promises';

import { BODY_MAX_BYTES, FIND_TIPS_API } from '@llf/contracts/find-tips';
import { clientIp, type App as ToolApp } from '@llf/find-my-tips';
import express, { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';

import { createTokenCheck, tokenFrom } from './auth';
import type { Config } from './config';
import type { ProxyLog } from './log';
import { createRelay, json, RELAY_PATH } from './relay';

export type ProxyDeps = {
  config: Config;
  tool: ToolApp;
  fetch?: typeof fetch;
  now?: () => Date;
  log?: (fields: ProxyLog) => void;
  docsPath?: string;
};

/** Express request → Web `Request`, so the tool and relay handlers stay runtime-agnostic. */
function toRequest(req: ExpressRequest): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) headers.append(name, v);
  }
  // Tokens stay at the proxy; nothing downstream needs them.
  headers.delete('authorization');
  headers.delete('x-goog-api-key');
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && Buffer.isBuffer(req.body);
  return new Request(`http://${req.headers.host ?? 'localhost'}${req.originalUrl}`, {
    method: req.method,
    headers,
    ...(hasBody ? { body: req.body as Buffer } : {}),
  });
}

async function send(res: ExpressResponse, response: Response): Promise<void> {
  res.status(response.status);
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

/**
 * Dev-only Gemini proxy for developers who can't reach Google from mainland China (TDD D39).
 * One URL and one personal token cover both kinds of local work:
 *
 * - `/api/find-tips/*`: the full Find My Tips API (the `find-my-tips` handler, Gemini only), for
 *   front-end work with `pnpm dev:fe:remote`.
 * - `/v1beta/models/{model}:generateContent`: the relay, for a locally run `find-my-tips`.
 *
 * Never on staging or prod: those run the tool in Next.js route handlers (D36).
 */
export function createProxyApp(deps: ProxyDeps): express.Express {
  const { config, tool } = deps;
  const log = deps.log ?? (() => {});
  const callerFor = createTokenCheck(config.tokens);
  const relay = createRelay({
    config: config.relay,
    log,
    ...(deps.fetch ? { fetch: deps.fetch } : {}),
    ...(deps.now ? { now: deps.now } : {}),
  });

  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);

  app.get('/healthz', (_req, res) => {
    res.set('cache-control', 'no-store').type('text/plain').send('ok');
  });

  // The handover doc (BD3244-121), so the team has one URL to bookmark. No secrets in it.
  app.get('/docs', async (_req, res) => {
    const path =
      deps.docsPath ?? new URL('../../../docs/runbooks/gemini-proxy.md', import.meta.url);
    try {
      res.type('text/markdown; charset=utf-8').send(await readFile(path, 'utf8'));
    } catch {
      res.status(404).end();
    }
  });

  // Everything below needs a personal token.
  const caller = new WeakMap<ExpressRequest, number>();
  app.use((req, res, next) => {
    const index = callerFor(tokenFrom(new Headers(req.headers as Record<string, string>)));
    if (index === undefined) {
      log({ event: 'reject', status: 401, reason: 'token' });
      void send(res, json(401, 'invalid proxy token'));
      return;
    }
    caller.set(req, index);
    next();
  });

  const raw = (limit: number) => express.raw({ type: () => true, limit, inflate: false });

  // Tool limit plus room for headers' worth of slack; the tool enforces its own BODY_MAX_BYTES.
  app.all(
    ['/api/find-tips', '/api/find-tips/{*rest}'],
    raw(BODY_MAX_BYTES + 1024),
    async (req, res) => {
      const started = Date.now();
      const request = toRequest(req);
      const ip = clientIp(
        request,
        req.socket.remoteAddress ?? 'unknown',
        config.tool.trustedProxyHops,
      );
      const response = await tool.handle(request, { ip });
      const route = new URL(request.url).pathname;
      log({
        event: response.ok ? 'request' : 'reject',
        route: 'tool',
        status: response.status,
        caller: caller.get(req)!,
        latencyMs: Date.now() - started,
        ...(route === FIND_TIPS_API.extract ? { model: config.tool.model } : {}),
      });
      await send(res, response);
    },
  );

  app.post(RELAY_PATH, raw(config.relay.bodyMaxBytes), async (req, res) => {
    await send(res, await relay(toRequest(req), caller.get(req)!));
  });

  app.use((req, res) => {
    log({ event: 'reject', status: 404, reason: 'path', caller: caller.get(req)! });
    void send(res, json(404, 'not found'));
  });

  // Oversized bodies (express.raw) and anything unexpected. Never echoes the request.
  app.use(
    (
      error: Error & { status?: number },
      _req: ExpressRequest,
      res: ExpressResponse,
      _next: express.NextFunction,
    ) => {
      const status = error.status === 413 ? 413 : 500;
      if (status === 500) console.error('gemini-proxy: error', error.name);
      log({ event: 'reject', status, reason: status === 413 ? 'size' : 'server' });
      void send(res, json(status, status === 413 ? 'request too large' : 'proxy error'));
    },
  );

  return app;
}
