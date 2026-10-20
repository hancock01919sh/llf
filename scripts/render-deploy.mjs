#!/usr/bin/env node
// Deploys one commit to the Render dev services and smoke-tests them (TDD §9.3, D27).
// Called by .github/workflows/deploy-dev.yml after CI passes on `dev`. No dependencies.
//
// Env:
//   RENDER_API_KEY                 Render API key (GitHub secret, `dev` environment)
//   DEPLOY_SHA                     commit to deploy
//   RENDER_SERVICE_ID_CMS          srv-… for llf-cms-dev     (optional: skipped when unset)
//   RENDER_SERVICE_ID_TIPS         srv-… for llf-tips-dev    (optional)
//   RENDER_SERVICE_ID_WEB          srv-… for llf-web-dev     (optional)
//   GITHUB_OUTPUT / GITHUB_STEP_SUMMARY  set by Actions
import { appendFileSync } from 'node:fs';

const API = 'https://api.render.com/v1';
const POLL_MS = 15_000;
const TIMEOUT_MS = 30 * 60_000;
const DONE = new Set([
  'live',
  'deactivated',
  'build_failed',
  'update_failed',
  'canceled',
  'pre_deploy_failed',
]);

const key = process.env.RENDER_API_KEY;
const sha = process.env.DEPLOY_SHA;
if (!key || !sha) {
  console.error('RENDER_API_KEY and DEPLOY_SHA are required.');
  process.exit(1);
}

// Order matters: the tool and CMS go first so the web service never points at an older API.
const SERVICES = [
  {
    name: 'cms',
    id: process.env.RENDER_SERVICE_ID_CMS,
    // `/admin` must be blocked for the runner, which is never on the allow-list (TDD §5.4).
    smoke: [
      ['/_health', [204]],
      ['/admin', [403]],
      ['/api/pages', [401, 403]],
    ],
  },
  { name: 'tips', id: process.env.RENDER_SERVICE_ID_TIPS, smoke: [] },
  {
    name: 'web',
    id: process.env.RENDER_SERVICE_ID_WEB,
    smoke: [
      ['/healthz', [200]],
      ['/', [401]],
    ],
  },
];

async function render(path, init = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new Error(`Render API ${init.method ?? 'GET'} ${path}: ${response.status}`);
  return response.json();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function deploy(service) {
  const started = await render(`/services/${service.id}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ commitId: sha, clearCache: 'do_not_clear' }),
  });
  console.log(`[${service.name}] deploy ${started.id} ${started.status}`);
  const deadline = Date.now() + TIMEOUT_MS;
  let status = started.status;
  while (!DONE.has(status)) {
    if (Date.now() > deadline) throw new Error(`[${service.name}] timed out (${status})`);
    await sleep(POLL_MS);
    ({ status } = await render(`/services/${service.id}/deploys/${started.id}`));
    console.log(`[${service.name}] ${status}`);
  }
  if (status !== 'live') throw new Error(`[${service.name}] deploy ${started.id} ended ${status}`);
  const details = await render(`/services/${service.id}`);
  return details.serviceDetails?.url;
}

// Render's edge can answer 502–504 for a short while after a deploy goes live, while traffic
// moves to the new instance.
const TRANSIENT = new Set([502, 503, 504]);
const SMOKE_ATTEMPTS = 10;

async function check(url) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000) });
    if (!TRANSIENT.has(response.status) || attempt === SMOKE_ATTEMPTS) return response;
    await sleep(10_000);
  }
}

async function smoke(service, url) {
  const failures = [];
  for (const [path, expected] of service.smoke) {
    const response = await check(`${url}${path}`);
    const ok = expected.includes(response.status);
    console.log(
      `[${service.name}] ${path} → ${response.status} ${ok ? 'ok' : `(want ${expected})`}`,
    );
    if (!ok)
      failures.push(`${path} returned ${response.status}, expected ${expected.join(' or ')}`);
  }
  return failures;
}

const rows = [];
let failed = false;
for (const service of SERVICES) {
  if (!service.id) {
    rows.push([service.name, 'skipped (no service ID set)', '']);
    continue;
  }
  try {
    const url = await deploy(service);
    const failures = url ? await smoke(service, url) : [];
    if (failures.length) failed = true;
    rows.push([
      service.name,
      failures.length ? `live, smoke failed: ${failures.join('; ')}` : 'live',
      url ?? '',
    ]);
    if (service.name === 'web' && url && process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `web_url=${url}\n`);
    }
  } catch (error) {
    failed = true;
    rows.push([service.name, error instanceof Error ? error.message : 'failed', '']);
    // Later services would run against a broken dependency, so stop here.
    break;
  }
}

const summary = [
  `### Render dev deploy of \`${sha.slice(0, 7)}\``,
  '',
  '| Service | Result | URL |',
  '|---|---|---|',
  ...rows.map(([name, result, url]) => `| ${name} | ${result} | ${url} |`),
  '',
].join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
process.exit(failed ? 1 : 0);
