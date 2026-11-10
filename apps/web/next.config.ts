import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';

// One `.env` at the repo root serves every app (README quickstart).
loadEnvConfig(path.resolve(import.meta.dirname, '../..'));

const TIPS_URL = process.env.TIPS_URL ?? `http://localhost:${process.env.TOOL_PORT ?? '8787'}`;
// const s3Base = process.env.CMS_URL;
/*
 * The site is a static export (TDD §6.2). `server.mjs` serves `out/` on Render dev and proxies
 * `/api/*` to the tool; in AWS, CloudFront does both. Rewrites only exist in `next dev`.
 */
export default function config(phase: string): NextConfig {
  const isExport = phase === PHASE_PRODUCTION_BUILD;
  return {
    ...(isExport ? { output: 'export' as const } : {}),
    env: {
      NEXT_PUBLIC_CMS_MEDIA_URL:
        process.env.NEXT_PUBLIC_CMS_MEDIA_URL ?? process.env.CMS_MEDIA_URL ?? process.env.CMS_URL,
    },
    trailingSlash: true,
    images: { unoptimized: true },
    reactStrictMode: true,
    poweredByHeader: false,
    transpilePackages: ['@llf/contracts', '@llf/matching', '@llf/ui'],
    ...(isExport
      ? {}
      : {
          async rewrites() {
            return [
              { source: '/api/:path*', destination: `${TIPS_URL}/api/:path*` },
              // { source: '/uploads/:path*', destination: `${s3Base}/uploads/:path*` },
            ];
          },
        }),
  };
}
