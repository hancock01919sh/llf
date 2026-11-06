import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { BODY_MAX_BYTES } from '@llf/contracts/find-tips';

import { createApp } from './app';
import { MemoryCacheStore, MemoryCounterStore } from './cache';
import { createCatalogSource } from './catalog';
import { loadConfig } from './config';
import { createProvider } from './extract';
import { clientIp, errorResponse } from './http';
import { stdoutLogger } from './log';

/**
 * Node http adapter for Render (Phase A, TDD §7.3). Basic auth is enforced by
 * the web proxy in front of this service; this process is not public.
 * Stores are in-memory here; Render Key Value / DynamoDB adapters replace them
 * behind the same interfaces.
 */
const config = loadConfig();
const logger = stdoutLogger;

const catalog = createCatalogSource({
  refreshMs: config.catalogRefreshMs,
  ...(config.catalogUrl ? { catalogUrl: config.catalogUrl } : {}),
  ...(config.catalogFile ? { catalogFile: config.catalogFile } : {}),
  onLoad: (catalogVersion) => logger({ requestId: '', event: 'catalog', catalogVersion }),
});

const app = createApp({
  config,
  catalog,
  provider: createProvider(config.provider, {
    anthropicApiKey: config.anthropicApiKey,
    openaiApiKey: config.openaiApiKey,
    geminiApiKey: config.geminiApiKey,
    geminiVertex: config.geminiVertex,
  }),
  cache: new MemoryCacheStore(),
  counters: new MemoryCounterStore(),
  logger,
});

class BodyTooLargeError extends Error {}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    size += buf.byteLength;
    if (size > BODY_MAX_BYTES) throw new BodyTooLargeError();
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

function toHeaders(req: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) headers.append(name, v);
  }
  return headers;
}

async function send(res: ServerResponse, response: Response, method: string): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  if (method === 'HEAD') {
    res.end();
    return;
  }
  res.end(Buffer.from(await response.arrayBuffer()));
}

const server = createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const hasBody = method !== 'GET' && method !== 'HEAD';
    let body: Buffer | undefined;
    if (hasBody) body = await readBody(req);
    const request = new Request(url, {
      method,
      headers: toHeaders(req),
      ...(body ? { body } : {}),
    });
    const ip = clientIp(request, req.socket.remoteAddress ?? 'unknown', config.trustedProxyHops);
    const response = await app.handle(request, { ip });
    await send(res, response, method);
  } catch (error) {
    const code = error instanceof BodyTooLargeError ? 'too_large' : 'server';
    if (code === 'server')
      console.error('find-my-tips: adapter error', error instanceof Error ? error.name : 'unknown');
    await send(
      res,
      errorResponse(crypto.randomUUID(), code, code === 'too_large' ? { connection: 'close' } : {}),
      method,
    );
  }
});

server.requestTimeout = config.handlerTimeoutMs + 5_000;

server.listen(config.port, () => {
  logger({
    requestId: '',
    event: 'start',
    port: config.port,
    provider: config.provider,
    model: config.model,
  });
});

function shutdown(): void {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
