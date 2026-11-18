#!/usr/bin/env node
// Dev only (TDD D39). Stands in for the local tool and forwards `/api/*` to a remote Find My Tips
// API, so `pnpm dev:fe:remote` gets live results without a model key on this laptop. Built for the
// China team: Google's API is unreachable from mainland China, but Render dev isn't. Next.js
// rewrites can't add an auth header, so this sits between them.
//
// The easy path, the Gemini proxy (same two lines as for tool work):
//   GEMINI_PROXY_URL    e.g. https://llf-gemini-relay-dev.onrender.com
//   GEMINI_PROXY_TOKEN  your personal token (from Art's secure share), sent as a Bearer token
// Or the Render dev site itself:
//   REMOTE_API_URL      e.g. https://llf-web-dev.onrender.com
//   REMOTE_API_AUTH     "user:pass" for that site (the dev BASIC_AUTH)
//   TOOL_PORT           where to listen; the web dev server already proxies /api/* here (8787)
import { createServer } from 'node:http';

const site = process.env.REMOTE_API_URL && process.env.REMOTE_API_AUTH;
const target = ((site ? process.env.REMOTE_API_URL : process.env.GEMINI_PROXY_URL) ?? '').replace(
  /\/+$/,
  '',
);
const credential = (site ? process.env.REMOTE_API_AUTH : process.env.GEMINI_PROXY_TOKEN) ?? '';
const port = Number(process.env.TOOL_PORT ?? '8787');
const MAX_BYTES = 6 * 1024 * 1024;

if (
  !/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(target) ||
  !credential ||
  (site && !credential.includes(':'))
) {
  console.error(
    'remote-api: set GEMINI_PROXY_URL and GEMINI_PROXY_TOKEN in .env (or REMOTE_API_URL and REMOTE_API_AUTH)',
  );
  process.exit(1);
}

const authorization = site
  ? `Basic ${Buffer.from(credential).toString('base64')}`
  : `Bearer ${credential}`;
const PASS_HEADERS = ['content-type', 'accept', 'x-request-id'];

const server = createServer(async (req, res) => {
  if (!req.url?.startsWith('/api/')) {
    res.writeHead(404).end();
    return;
  }
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.byteLength;
      if (size > MAX_BYTES) {
        res.writeHead(413, { connection: 'close' }).end();
        return;
      }
      chunks.push(chunk);
    }
    const headers = { authorization };
    for (const name of PASS_HEADERS) {
      const value = req.headers[name];
      if (typeof value === 'string') headers[name] = value;
    }
    const upstream = await fetch(`${target}${req.url}`, {
      method: req.method,
      headers,
      ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
    });
    res.writeHead(upstream.status, {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    });
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    // Never log bodies (D20): only the method, path, and error name.
    console.error(`remote-api: ${req.method} ${req.url.split('?')[0]} failed`, error?.name);
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' });
    res.end('{"error":"remote_api"}');
  }
});

server.listen(port, () => console.warn(`remote-api: localhost:${port}/api → ${target}/api`));
