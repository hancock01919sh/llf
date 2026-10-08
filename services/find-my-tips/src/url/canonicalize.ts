import { createHash } from 'node:crypto';

const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'igshid', 'dclid', 'msclkid']);
const TRACKING_PREFIXES = ['utm_', 'mc_'];

function isTracking(name: string): boolean {
  const lower = name.toLowerCase();
  return TRACKING_PARAMS.has(lower) || TRACKING_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * Normalizes a recipe URL for cache keys (TDD §7.5): lowercase scheme and
 * host (done by WHATWG URL), no fragment, no tracking params, sorted query.
 * Returns `null` for anything that is not an absolute http(s) URL.
 */
export function canonicalizeUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;

  url.hash = '';
  for (const name of [...url.searchParams.keys()]) {
    if (isTracking(name)) url.searchParams.delete(name);
  }
  url.searchParams.sort();
  if (url.search === '?') url.search = '';
  return url;
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
