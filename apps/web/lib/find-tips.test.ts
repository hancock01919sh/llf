import { FIND_TIPS_API, type ExtractRequest, type ExtractResponse } from '@llf/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  classifyResponse,
  errorReason,
  fetchToolMode,
  IMAGE_UPLOAD_MAX_BYTES,
  parseStatus,
  requestExtract,
  resultView,
  saveHandoff,
  takeHandoff,
  uniqueSlugs,
  validateFile,
  validateText,
  validateUrl,
  type Outcome,
} from './find-tips';

const response = (overrides: Partial<ExtractResponse> = {}): ExtractResponse => ({
  requestId: 'req-1',
  detectedType: 'recipe',
  readable: true,
  matches: [{ slug: 'banana', title: 'Banana', inferred: false }],
  unmatchedCount: 0,
  source: 'jsonld',
  catalogVersion: 'abc123',
  ...overrides,
});

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

describe('validators', () => {
  it('validateUrl', () => {
    expect(validateUrl('  ')).toBe('empty');
    expect(validateUrl('ftp://example.com/recipe')).toBe('invalidUrl');
    expect(validateUrl('not a url')).toBe('invalidUrl');
    expect(validateUrl(`https://example.com/${'a'.repeat(2048)}`)).toBe('invalidUrl');
    expect(validateUrl(' https://example.com/recipe ')).toBeNull();
  });

  it('validateText', () => {
    expect(validateText('')).toBe('empty');
    expect(validateText('x'.repeat(5001))).toBe('tooLarge');
    expect(validateText('2 bananas')).toBeNull();
  });

  it('validateFile', () => {
    const file = (type: string, size = 10) => {
      const f = new File(['x'], 'photo', { type });
      Object.defineProperty(f, 'size', { value: size });
      return f;
    };
    expect(validateFile(null)).toBe('empty');
    expect(validateFile(file('image/gif'))).toBe('unsupportedFile');
    expect(validateFile(file('image/jpeg', IMAGE_UPLOAD_MAX_BYTES + 1))).toBe('tooLarge');
    expect(validateFile(file('image/webp'))).toBeNull();
  });
});

describe('classifyResponse', () => {
  const none = new Headers();
  const error = (code: string) => ({ requestId: 'r', code });

  it.each<[string, number, unknown, Headers, Outcome]>([
    [
      'bad 200 body',
      200,
      { nope: true },
      none,
      { kind: 'error', reason: 'server', retryable: true },
    ],
    ['WAF 202', 202, null, none, { kind: 'error', reason: 'challenge', retryable: false }],
    ['WAF 405', 405, null, none, { kind: 'error', reason: 'challenge', retryable: false }],
    [
      'WAF header',
      403,
      null,
      new Headers({ 'x-amzn-waf-action': 'captcha' }),
      { kind: 'error', reason: 'challenge', retryable: false },
    ],
    [
      'blocked recipe site',
      424,
      error('source_unavailable'),
      none,
      { kind: 'error', reason: 'site_blocked', retryable: false },
    ],
    [
      '429 default wait',
      429,
      error('rate_limited'),
      none,
      { kind: 'rateLimited', retryAfterMs: 30_000 },
    ],
    [
      '429 retry-after',
      429,
      null,
      new Headers({ 'retry-after': '12' }),
      { kind: 'rateLimited', retryAfterMs: 12_000 },
    ],
    [
      '429 capped',
      429,
      null,
      new Headers({ 'retry-after': '9999' }),
      { kind: 'rateLimited', retryAfterMs: 300_000 },
    ],
    ['503', 503, error('unavailable'), none, { kind: 'unavailable' }],
    ['413', 413, error('too_large'), none, { kind: 'tooLarge' }],
    ['415', 415, error('unsupported_media_type'), none, { kind: 'unsupportedFile' }],
    ['422', 422, error('url_not_allowed'), none, { kind: 'invalidUrl' }],
    ['400 url_not_allowed', 400, error('url_not_allowed'), none, { kind: 'invalidUrl' }],
    [
      '400 other',
      400,
      error('invalid_request'),
      none,
      { kind: 'error', reason: 'server', retryable: false },
    ],
    ['504', 504, null, none, { kind: 'error', reason: 'timeout', retryable: true }],
    [
      'timeout code',
      502,
      error('timeout'),
      none,
      { kind: 'error', reason: 'timeout', retryable: true },
    ],
    ['500', 500, error('server'), none, { kind: 'error', reason: 'server', retryable: true }],
    ['404', 404, error('not_found'), none, { kind: 'error', reason: 'server', retryable: false }],
  ])('%s', (_name, status, body, headers, expected) => {
    expect(classifyResponse(status, body, headers)).toEqual(expected);
  });

  it('parses a valid 200', () => {
    const body = response();
    expect(classifyResponse(200, body, none)).toEqual({ kind: 'result', response: body });
  });
});

describe('errorReason', () => {
  it.each<[Outcome, string | null]>([
    [{ kind: 'result', response: response() }, null],
    [{ kind: 'unavailable' }, null],
    [{ kind: 'rateLimited', retryAfterMs: 1 }, 'rate_limited'],
    [{ kind: 'invalidUrl' }, 'invalid_url'],
    [{ kind: 'tooLarge' }, 'too_large'],
    [{ kind: 'unsupportedFile' }, 'server'],
    [{ kind: 'error', reason: 'challenge', retryable: false }, 'challenge'],
    [{ kind: 'error', reason: 'site_blocked', retryable: false }, 'site_blocked'],
  ])('%o → %s', (outcome, expected) => {
    expect(errorReason(outcome)).toBe(expected);
  });
});

describe('status', () => {
  it('parseStatus only trusts a valid 200', () => {
    expect(parseStatus(200, { mode: 'live', catalogVersion: 'v' })).toBe('live');
    expect(parseStatus(200, { mode: 'jsonld-only', catalogVersion: 'v' })).toBe('jsonld-only');
    expect(parseStatus(200, { mode: 'sideways' })).toBe('off');
    expect(parseStatus(500, { mode: 'live', catalogVersion: 'v' })).toBe('off');
  });

  it('fetchToolMode calls the status endpoint and fails closed', async () => {
    const fetcher = vi.fn(async () => json(200, { mode: 'live', catalogVersion: 'v' }));
    await expect(fetchToolMode(fetcher)).resolves.toBe('live');
    expect(fetcher).toHaveBeenCalledWith(FIND_TIPS_API.status, { cache: 'no-store' });

    await expect(fetchToolMode(async () => new Response('<html>', { status: 200 }))).resolves.toBe(
      'off',
    );
    await expect(
      fetchToolMode(async () => {
        throw new TypeError('offline');
      }),
    ).resolves.toBe('off');
  });
});

describe('requestExtract', () => {
  const body: ExtractRequest = { inputType: 'text', text: '2 bananas' };

  it('POSTs JSON to the extract endpoint', async () => {
    const fetcher = vi.fn(async () => json(200, response()));
    const outcome = await requestExtract(body, new AbortController().signal, fetcher);
    expect(outcome.kind).toBe('result');
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(FIND_TIPS_API.extract);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it('never auto-retries a blocked recipe site', async () => {
    const fetcher = vi.fn(async () => json(424, { requestId: 'x', code: 'source_unavailable' }));
    await expect(requestExtract(body, new AbortController().signal, fetcher)).resolves.toEqual({
      kind: 'error',
      reason: 'site_blocked',
      retryable: false,
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('retries once on 502/504, then classifies', async () => {
    const fetcher = vi
      .fn<(input: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(json(502, null))
      .mockResolvedValueOnce(json(200, response()));
    await expect(
      requestExtract(body, new AbortController().signal, fetcher),
    ).resolves.toMatchObject({ kind: 'result' });
    expect(fetcher).toHaveBeenCalledTimes(2);

    const always504 = vi.fn(async () => json(504, null));
    await expect(requestExtract(body, new AbortController().signal, always504)).resolves.toEqual({
      kind: 'error',
      reason: 'timeout',
      retryable: true,
    });
    expect(always504).toHaveBeenCalledTimes(2);
  });

  it('does not retry other errors', async () => {
    const fetcher = vi.fn(async () => json(500, null));
    await requestExtract(body, new AbortController().signal, fetcher);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('turns a network failure into a retryable error', async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError('offline');
    });
    await expect(requestExtract(body, new AbortController().signal, fetcher)).resolves.toEqual({
      kind: 'error',
      reason: 'server',
      retryable: true,
    });
  });

  it('rethrows when the caller aborted', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn(async () => {
      controller.abort();
      throw new DOMException('aborted', 'AbortError');
    });
    await expect(requestExtract(body, controller.signal, fetcher)).rejects.toThrow('aborted');
  });
});

describe('resultView', () => {
  it('reports unreadable and no-match inputs', () => {
    expect(resultView(response({ readable: false, matches: [] }))).toEqual({ kind: 'unreadable' });
    expect(resultView(response({ matches: [] }))).toEqual({ kind: 'noMatch' });
  });

  it('asks about inferred matches before navigating', () => {
    const view = resultView(
      response({
        detectedType: 'dish',
        matches: [
          { slug: 'bread', title: 'Bread', inferred: false },
          { slug: 'basil', title: 'Basil', inferred: true },
        ],
      }),
    );
    expect(view).toMatchObject({
      kind: 'likely',
      confirmed: [{ slug: 'bread' }],
      likely: [{ slug: 'basil' }],
    });
  });

  it('navigates with unique slugs', () => {
    const banana = { slug: 'banana', title: 'Banana', inferred: false };
    expect(resultView(response({ matches: [banana, banana] }))).toEqual({
      kind: 'navigate',
      slugs: ['banana'],
    });
  });
});

describe('uniqueSlugs', () => {
  it('dedupes and caps at 30', () => {
    const matches = Array.from({ length: 40 }, (_, i) => ({
      slug: `s${i % 35}`,
      title: 'T',
      inferred: false,
    }));
    const slugs = uniqueSlugs(matches);
    expect(slugs).toHaveLength(30);
    expect(new Set(slugs).size).toBe(30);
  });
});

describe('handoff', () => {
  afterEach(() => sessionStorage.clear());

  const handoff = {
    inputType: 'url',
    source: 'jsonld',
    unmatchedCount: 2,
    latencyMs: 812,
    catalogVersion: 'v',
  } as const;

  it('is read once', () => {
    saveHandoff(handoff);
    expect(takeHandoff()).toEqual(handoff);
    expect(takeHandoff()).toBeNull();
  });

  it('ignores tampered or extra data', () => {
    sessionStorage.setItem(
      'llf:find-tips-result',
      JSON.stringify({ ...handoff, unmatchedCount: -1 }),
    );
    expect(takeHandoff()).toBeNull();
    sessionStorage.setItem('llf:find-tips-result', '{not json');
    expect(takeHandoff()).toBeNull();
  });
});
