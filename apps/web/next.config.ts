import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

// One `.env` at the repo root serves every app (README quickstart).
loadEnvConfig(path.resolve(import.meta.dirname, '../..'));

// Render passes the private tool service as `host:port` (Blueprint `hostport`), with no scheme.
// Next.js rejects a rewrite destination without one, so add `http://` when it's missing.
const TIPS_TARGET = process.env.TIPS_URL || `localhost:${process.env.TOOL_PORT ?? '8787'}`;
const TIPS_URL = (/^https?:\/\//.test(TIPS_TARGET) ? TIPS_TARGET : `http://${TIPS_TARGET}`).replace(
  /\/+$/,
  '',
);

/*
 * Next.js standalone server (TDD D36, §5.3, §6.2). Pages use ISR (`revalidate: 60`) and are
 * rendered on first request, so the build needs no Strapi. Basic auth, `/uploads/*` and the
 * trailing-slash 301 live in `middleware.ts`; `server.mjs` is retired.
 *
 * The tool API is still proxied to `services/find-my-tips` until its handlers move into
 * `/api/find-tips/*` route handlers (BD3244-87, tool part).
 */
export default function config(): NextConfig {
  return {
    output: 'standalone',
    // pnpm workspaces: trace from the repo root so workspace deps land in `.next/standalone`.
    outputFileTracingRoot: path.resolve(import.meta.dirname, '../..'),
    trailingSlash: true,
    // middleware.ts issues the 301 itself so the query string survives (`?i=`) and `/healthz`
    // never becomes `/healthz/`. Next's own redirect would run first and drop the query.
    skipTrailingSlashRedirect: true,
    images: { unoptimized: true },
    reactStrictMode: true,
    poweredByHeader: false,
    transpilePackages: ['@llf/contracts', '@llf/matching', '@llf/ui'],
    async rewrites() {
      return [{ source: '/api/:path*', destination: `${TIPS_URL}/api/:path*` }];
    },
  };
}
