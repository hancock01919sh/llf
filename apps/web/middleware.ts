import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { slashRedirect } from './lib/slash-redirect';

/*
 * Request handling that used to live in `server.mjs` (TDD D36, §6.2). Next runs this before
 * routing, so the trailing-slash 301 wins over Next's own 308 and keeps the query string (`?i=`).
 */

const BASIC_AUTH = process.env.BASIC_AUTH ?? '';
const MEDIA_BASE = (process.env.CMS_MEDIA_URL ?? process.env.CMS_URL ?? '').replace(/\/$/, '');
const NOINDEX = process.env.SITE_ENV !== 'prod';

/** Compares in constant time so the Basic Auth secret can't be probed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorized(request: NextRequest): boolean {
  if (!BASIC_AUTH) return true;
  const header = request.headers.get('authorization') ?? '';
  if (!header.toLowerCase().startsWith('basic ')) return false;
  try {
    return safeEqual(atob(header.slice(6)), BASIC_AUTH);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest): Response {
  const { pathname, search } = request.nextUrl;

  // Health checks come from the platform, which has no credentials.
  if (pathname === '/healthz') {
    return new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } });
  }

  if (!authorized(request)) {
    return new Response(null, {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Long Live Food (dev)"' },
    });
  }

  // `/uploads/*` redirects to the CMS media origin. 302 so the target can change per environment.
  if (pathname.startsWith('/uploads/')) {
    if (!MEDIA_BASE) {
      return NextResponse.json(
        { requestId: crypto.randomUUID(), code: 'media_upstream_unconfigured' },
        { status: 502 },
      );
    }
    return new Response(null, {
      status: 302,
      headers: { Location: `${MEDIA_BASE}${pathname}${search}` },
    });
  }

  // The tool API is POSTed to; a slash redirect there would break the request (and save nothing).
  if (!pathname.startsWith('/api/')) {
    const target = slashRedirect(`${pathname}${search}`);
    // Next parses this Location with `new URL()`, so it must be absolute here.
    if (target) return NextResponse.redirect(new URL(target, request.url), 301);
  }

  const response = NextResponse.next();
  // Dev, staging and previews are never indexed (TDD §6.7).
  if (NOINDEX) response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  // Static assets never need auth, a redirect or the headers above.
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
