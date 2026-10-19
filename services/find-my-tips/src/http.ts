import type { ErrorCode, ErrorResponse } from '@llf/contracts/find-tips';

/** HTTP status for each error code; mirrors `classifyResponse` in apps/web/lib/find-tips.ts. */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  invalid_request: 400,
  too_large: 413,
  unsupported_media_type: 415,
  url_not_allowed: 422,
  rate_limited: 429,
  unavailable: 503,
  upstream_error: 502,
  source_unavailable: 424,
  timeout: 504,
  not_found: 404,
  method_not_allowed: 405,
  server: 500,
};

/** Thrown inside the pipeline; the handler turns it into an `ErrorResponse`. */
export class ToolError extends Error {
  readonly code: ErrorCode;
  readonly headers: Record<string, string>;

  constructor(code: ErrorCode, headers: Record<string, string> = {}, options?: ErrorOptions) {
    super(code, options);
    this.name = 'ToolError';
    this.code = code;
    this.headers = headers;
  }
}

const BASE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...BASE_HEADERS, 'x-request-id': requestIdOf(body), ...headers },
  });
}

export function errorResponse(
  requestId: string,
  code: ErrorCode,
  headers: Record<string, string> = {},
): Response {
  const body: ErrorResponse = { requestId, code };
  return json(body, ERROR_STATUS[code], headers);
}

function requestIdOf(body: unknown): string {
  if (body && typeof body === 'object' && 'requestId' in body) {
    const id = (body as { requestId: unknown }).requestId;
    if (typeof id === 'string') return id;
  }
  return '';
}

/**
 * Client address for rate limits. Each proxy we run appends the address it received the request
 * from to `x-forwarded-for`, so with `trustedHops` proxies in front of the service the client is
 * that many entries from the right. Entries further left come from the client and can be forged.
 * With no trusted proxies (local dev), the socket address supplied by the adapter is used.
 */
export function clientIp(req: Request, fallback = 'unknown', trustedHops = 0): string {
  if (trustedHops < 1) return fallback;
  const hops = (req.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops[hops.length - trustedHops] ?? fallback;
}
