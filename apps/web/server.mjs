// Serves the static export the way CloudFront will (TDD §6.2, §9.1): files from `out/`, `/api/*`
// proxied to the Find My Tips service, `404.html` for unknown paths. Used on Render dev and by
// Playwright. Production never runs this; AWS uses S3 + CloudFront.
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { Readable } from 'node:stream';
import handler from 'serve-handler';
import { slashRedirect } from './lib/slash-redirect.mjs';

const ROOT = path.join(import.meta.dirname, 'out');
const PORT = Number(process.env.PORT ?? 3000);
const TIPS_URL = (
  process.env.TIPS_URL ?? `http://localhost:${process.env.TOOL_PORT ?? '8787'}`
).replace(/\/$/, '');
const NOINDEX = process.env.SITE_ENV !== 'prod';
const BASIC_AUTH = process.env.BASIC_AUTH ?? '';
const API_TIMEOUT_MS = 40_000;
const API_MAX_BODY = 40 * 1024 * 1024;

if (!existsSync(path.join(ROOT, 'index.html'))) {
  console.error('apps/web/out is missing. Run `pnpm --filter @llf/web build` first.');
  process.exit(1);
}

function authorized(req) {
  if (!BASIC_AUTH) return true;
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Basic ')) return false;
  const given = Buffer.from(Buffer.from(header.slice(6), 'base64').toString());
  const expected = Buffer.from(BASIC_AUTH);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

// Same shape as the service's errors: `ErrorResponse` in packages/contracts/src/find-tips.ts.
function sendError(res, status, code) {
  const requestId = randomUUID();
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-request-id': requestId,
  });
  res.end(JSON.stringify({ requestId, code }));
}

async function proxy(req, res) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > API_MAX_BODY) {
      sendError(res, 413, 'too_large');
      return;
    }
    chunks.push(chunk);
  }
  const headers = Object.fromEntries(
    Object.entries(req.headers).filter(
      ([name]) => !HOP_BY_HOP.has(name) && name !== 'authorization',
    ),
  );
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  try {
    const upstream = await fetch(`${TIPS_URL}${req.url}`, {
      method: req.method,
      headers,
      body: hasBody ? Buffer.concat(chunks) : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    const out = {};
    upstream.headers.forEach((value, name) => {
      if (!HOP_BY_HOP.has(name) && name !== 'content-encoding') out[name] = value;
    });
    res.writeHead(upstream.status, out);
    if (upstream.body) Readable.fromWeb(upstream.body).pipe(res);
    else res.end();
  } catch (error) {
    // Never log the request body: it can hold user input (TDD D20).
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    console.error(
      `[server] /api proxy ${timedOut ? 'timed out' : 'failed'}: ${req.method} ${req.url.split('?')[0]}`,
    );
    sendError(res, timedOut ? 504 : 502, timedOut ? 'timeout' : 'upstream_error');
  }
}

const server = http.createServer((req, res) => {
  if (NOINDEX) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Health checks come from the platform, which has no credentials.
  if (req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
    return;
  }
  if (!authorized(req)) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Long Live Food (dev)"' }).end();
    return;
  }
  if (req.url?.startsWith('/api/')) {
    void proxy(req, res);
    return;
  }
  // serve-handler's own slash redirect drops the query string (and with it `?i=`), so do it here.
  const target = slashRedirect(req.url);
  if (target) {
    res.writeHead(301, { Location: target }).end();
    return;
  }
  // serve-handler answers unknown paths with out/404.html.
  void handler(req, res, {
    public: ROOT,
    cleanUrls: true,
    trailingSlash: true,
    directoryListing: false,
  });
});

server.listen(PORT, () => {
  console.warn(`[server] out/ on http://localhost:${PORT} (api → ${TIPS_URL})`);
});
