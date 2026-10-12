/** Statuses where the origin refused us: unauthorized, forbidden, rate limited, legal block. */
const BLOCKED_STATUSES = new Set([401, 403, 429, 451]);

/** Challenge interstitials are small; a real recipe page is far larger. */
const CHALLENGE_BODY_MAX = 64 * 1024;

const CHALLENGE_MARKERS = [
  'cdn-cgi/challenge-platform',
  '<title>just a moment...</title>',
  'cf-browser-verification',
  'captcha-delivery.com',
  'px-captcha',
  '_incapsula_resource',
  'pardon our interruption',
  'errors.edgesuite.net',
];

type Headers = Record<string, string | undefined>;

/** Cloudflare sets `cf-mitigated: challenge` on its interstitials, whatever the status. */
function hasChallengeHeader(headers: Headers): boolean {
  return (headers['cf-mitigated'] ?? '').toLowerCase() === 'challenge';
}

function hasChallengeMarker(body: Uint8Array): boolean {
  if (body.byteLength === 0 || body.byteLength > CHALLENGE_BODY_MAX) return false;
  const text = new TextDecoder('utf-8', { fatal: false }).decode(body).toLowerCase();
  return CHALLENGE_MARKERS.some((marker) => text.includes(marker));
}

/**
 * True when the origin refused or challenged our fetch (Spike P8, BD3244-36). Looks only at
 * status, headers, and fixed markers in small pages; never logs the body or URL.
 */
export function isSiteBlocked(status: number, headers: Headers, body: Uint8Array): boolean {
  if (BLOCKED_STATUSES.has(status)) return true;
  if (hasChallengeHeader(headers)) return true;
  const ambiguous = status === 503 || (status >= 200 && status < 300);
  return ambiguous && hasChallengeMarker(body);
}
