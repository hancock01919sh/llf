import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { loadConfig } from './config';
import { createRelay, type RelayLog } from './relay';

/** Node http adapter for Render dev (TDD D38). Public, so every request needs a relay token. */
const config = loadConfig();
const log = (fields: RelayLog) =>
  process.stdout.write(`${JSON.stringify({ ts: new Date().toISOString(), ...fields })}\n`);
const relay = createRelay({ config, log });

class BodyTooLargeError extends Error {}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    size += buf.byteLength;
    if (size > config.bodyMaxBytes) throw new BodyTooLargeError();
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
    const body = method === 'POST' ? await readBody(req) : undefined;
    const request = new Request(url, {
      method,
      headers: toHeaders(req),
      ...(body ? { body } : {}),
    });
    await send(res, await relay.handle(request), method);
  } catch (error) {
    const tooLarge = error instanceof BodyTooLargeError;
    if (!tooLarge) {
      console.error('gemini-relay: adapter error', error instanceof Error ? error.name : 'unknown');
    }
    res.statusCode = tooLarge ? 413 : 500;
    res.setHeader('content-type', 'application/json');
    if (tooLarge) res.setHeader('connection', 'close');
    res.end(JSON.stringify({ error: { code: res.statusCode, message: 'relay error' } }));
  }
});

server.requestTimeout = config.timeoutMs + 5_000;

server.listen(config.port, () => log({ event: 'start', port: config.port }));

function shutdown(): void {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
