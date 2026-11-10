/** Path helpers that are safe to import from client components (no Node APIs). */

import type { cmsType } from '@llf/contracts';

/** Strips slashes so `/about/`, `about`, and `about/` are the same path. Home is `''`. */
export function normalizePath(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

/** Site-relative href with the trailing slash the static export uses (`trailingSlash: true`). */
export function pageHref(path: string): string {
  const clean = normalizePath(path);
  return clean ? `/${clean}/` : '/';
}

/** A CTA links to a CMS page when one is set, otherwise to its `href`. */
export function ctaHref(cta: cmsType.shared.Cta): string | null {
  if (cta.page) return pageHref(cta.page.path);
  return cta.href?.trim() || null;
}

export function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

/** Results page link. Slugs go in `?i=` (allow-listed for analytics); user text never does (TDD §7.10). */
export function resultsHref(slugs: string[]): string {
  return `/find-my-tips/results/?i=${slugs.join(',')}`;
}
