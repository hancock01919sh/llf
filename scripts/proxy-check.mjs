#!/usr/bin/env node
// Dev only (TDD D39). Checks that GEMINI_PROXY_URL and GEMINI_PROXY_TOKEN in .env work:
// health, the Find My Tips status, and one small live extraction. Prints what failed and why;
// never prints the token. Run: pnpm proxy:check
const base = (process.env.GEMINI_PROXY_URL ?? '').replace(/\/+$/, '');
const token = process.env.GEMINI_PROXY_TOKEN ?? '';
if (!base || !token) {
  console.error(
    'proxy:check: set GEMINI_PROXY_URL and GEMINI_PROXY_TOKEN in .env (see docs/runbooks/gemini-proxy.md)',
  );
  process.exit(1);
}

const auth = { authorization: `Bearer ${token}` };
let failed = false;

async function step(name, run) {
  try {
    const detail = await run();
    console.log(`ok    ${name}${detail ? ` (${detail})` : ''}`);
  } catch (error) {
    failed = true;
    console.log(`FAIL  ${name}: ${error.message}`);
  }
}

async function call(path, init = {}) {
  const res = await fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(40_000) });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    const code = body?.code ?? body?.error?.message ?? text.slice(0, 80);
    const hint = res.status === 401 ? ' (token wrong or revoked: ask Art for a new one)' : '';
    throw new Error(`HTTP ${res.status} ${code}${hint}`);
  }
  return body;
}

console.log(`proxy:check → ${base}`);
await step('health', async () => {
  await call('/healthz');
});
await step('token + tool status', async () => {
  const body = await call('/api/find-tips/status', { headers: auth });
  return `mode ${body.mode}, catalog ${body.catalogVersion}`;
});
await step('live extraction (one Gemini call)', async () => {
  const started = Date.now();
  const body = await call('/api/find-tips/extract', {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ inputType: 'text', text: 'milk, eggs, spinach' }),
  });
  return `${body.matches.length} matches, source ${body.source}, ${Date.now() - started} ms`;
});

process.exit(failed ? 1 : 0);
