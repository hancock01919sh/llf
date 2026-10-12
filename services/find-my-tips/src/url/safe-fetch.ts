import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import type { LookupFunction } from 'node:net';

import { canonicalizeUrl } from './canonicalize';
import { isSiteBlocked } from './blocked';
import { isBlockedIp } from './ip';

export type SafeFetchReason =
  'url_not_allowed' | 'upstream_error' | 'timeout' | 'source_unavailable';

export class SafeFetchError extends Error {
  readonly reason: SafeFetchReason;

  constructor(reason: SafeFetchReason) {
    super(reason);
    this.name = 'SafeFetchError';
    this.reason = reason;
  }
}

/** Resolves a hostname to every address it maps to. */
export type Resolver = (hostname: string) => Promise<string[]>;

export type TransportRequest = {
  url: URL;
  /** The pre-validated address to connect to. The transport must not resolve the host again. */
  address: string;
  signal: AbortSignal;
  maxBytes: number;
  userAgent: string;
};

export type TransportResponse = {
  status: number;
  headers: Record<string, string | undefined>;
  body: Uint8Array;
};

export type Transport = (request: TransportRequest) => Promise<TransportResponse>;

export type SafeFetchOptions = {
  resolve?: Resolver;
  transport?: Transport;
  maxRedirects?: number;
  maxBytes?: number;
  timeoutMs?: number;
  userAgent?: string;
  signal?: AbortSignal;
};

export type SafeFetchResult = { finalUrl: URL; html: string };

export const SAFE_FETCH_DEFAULTS = {
  maxRedirects: 3,
  maxBytes: 3 * 1024 * 1024,
  timeoutMs: 5_000,
  userAgent: 'LongLiveFoodBot/0.1 (+https://longlivefood.org)',
} as const;

const ALLOWED_PORTS = new Set(['', '80', '443']);
const HTML_TYPES = new Set(['text/html', 'application/xhtml+xml']);

function bareHost(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}

export const defaultResolver: Resolver = async (hostname) => {
  const host = bareHost(hostname);
  if (isIP(host)) return [host];
  const results = await lookup(host, { all: true, verbatim: true });
  return results.map((r) => r.address);
};

/**
 * Node http(s) transport. The socket connects to `address` (already checked
 * against the blocklist) while Host and SNI still carry the real hostname, so
 * a second DNS answer cannot rebind the request to a private address.
 */
export const nodeTransport: Transport = ({ url, address, signal, maxBytes, userAgent }) =>
  new Promise<TransportResponse>((resolve, reject) => {
    const family = isIP(address);
    const pinned: LookupFunction = (_hostname, options, callback) => {
      if (options.all) callback(null, [{ address, family }]);
      else callback(null, address, family);
    };
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(
      url,
      {
        method: 'GET',
        lookup: pinned,
        signal,
        headers: {
          'user-agent': userAgent,
          accept: 'text/html,application/xhtml+xml;q=0.9',
          'accept-encoding': 'identity',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            res.destroy();
            req.destroy();
            reject(new SafeFetchError('upstream_error'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          const headers: Record<string, string | undefined> = {};
          for (const [name, value] of Object.entries(res.headers)) {
            headers[name] = Array.isArray(value) ? value.join(', ') : value;
          }
          resolve({
            status: res.statusCode ?? 0,
            headers,
            body: new Uint8Array(Buffer.concat(chunks)),
          });
        });
        res.on('error', (error) => reject(error));
      },
    );
    req.on('error', (error) => reject(error));
    req.end();
  });

async function checkTarget(url: URL, resolve: Resolver): Promise<string> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new SafeFetchError('url_not_allowed');
  if (!ALLOWED_PORTS.has(url.port)) throw new SafeFetchError('url_not_allowed');
  if (url.username || url.password) throw new SafeFetchError('url_not_allowed');

  let addresses: string[];
  try {
    addresses = await resolve(url.hostname);
  } catch {
    throw new SafeFetchError('url_not_allowed');
  }
  // Any blocked answer rejects the host: an attacker controls which one we'd get.
  if (addresses.length === 0 || addresses.some(isBlockedIp))
    throw new SafeFetchError('url_not_allowed');
  return addresses[0] as string;
}

function mediaType(contentType: string | undefined): string {
  return (contentType ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
}

function charset(contentType: string | undefined): string {
  const match = /charset\s*=\s*"?([\w-]+)"?/i.exec(contentType ?? '');
  return match?.[1]?.toLowerCase() ?? 'utf-8';
}

function decode(body: Uint8Array, contentType: string | undefined): string {
  try {
    return new TextDecoder(charset(contentType)).decode(body);
  } catch {
    return new TextDecoder('utf-8').decode(body);
  }
}

/**
 * Fetches a public recipe page without letting user input reach internal
 * hosts (TDD §7.6): http/https on 80/443 only, every DNS answer checked
 * against the private-range blocklist, the connection pinned to the checked
 * address, each redirect re-validated, and a byte and time budget.
 */
export async function safeFetch(
  input: URL | string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const resolve = options.resolve ?? defaultResolver;
  const transport = options.transport ?? nodeTransport;
  const maxRedirects = options.maxRedirects ?? SAFE_FETCH_DEFAULTS.maxRedirects;
  const maxBytes = options.maxBytes ?? SAFE_FETCH_DEFAULTS.maxBytes;
  const userAgent = options.userAgent ?? SAFE_FETCH_DEFAULTS.userAgent;
  const timeout = AbortSignal.timeout(options.timeoutMs ?? SAFE_FETCH_DEFAULTS.timeoutMs);
  const signal = options.signal ? AbortSignal.any([timeout, options.signal]) : timeout;

  let url = typeof input === 'string' ? canonicalizeUrl(input) : canonicalizeUrl(input.href);
  if (!url) throw new SafeFetchError('url_not_allowed');

  for (let redirects = 0; ; redirects++) {
    const address = await checkTarget(url, resolve);
    if (signal.aborted) throw new SafeFetchError('timeout');

    let response: TransportResponse;
    try {
      response = await transport({ url, address, signal, maxBytes, userAgent });
    } catch (error) {
      if (signal.aborted) throw new SafeFetchError('timeout');
      if (error instanceof SafeFetchError) throw error;
      throw new SafeFetchError('upstream_error');
    }
    if (response.body.byteLength > maxBytes) throw new SafeFetchError('upstream_error');

    const { status, headers } = response;
    if (isSiteBlocked(status, headers, response.body))
      throw new SafeFetchError('source_unavailable');
    if (status >= 300 && status < 400 && headers.location) {
      if (redirects >= maxRedirects) throw new SafeFetchError('url_not_allowed');
      let next: URL;
      try {
        next = new URL(headers.location, url);
      } catch {
        throw new SafeFetchError('url_not_allowed');
      }
      const canonical = canonicalizeUrl(next.href);
      if (!canonical) throw new SafeFetchError('url_not_allowed');
      url = canonical;
      continue;
    }
    if (status < 200 || status >= 300) throw new SafeFetchError('upstream_error');
    if (!HTML_TYPES.has(mediaType(headers['content-type'])))
      throw new SafeFetchError('url_not_allowed');

    return { finalUrl: url, html: decode(response.body, headers['content-type']) };
  }
}
