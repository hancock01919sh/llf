import { describe, expect, it } from 'vitest';

import { PUBLIC_IP, fakeResolver, fakeTransport } from '../test-utils';
import { safeFetch } from './safe-fetch';

const resolve = fakeResolver({
  'recipes.test': [PUBLIC_IP],
  'other.test': [PUBLIC_IP],
  'internal.test': ['10.0.0.5'],
  'mixed.test': [PUBLIC_IP, '127.0.0.1'],
  'metadata.test': ['169.254.169.254'],
  'empty.test': [],
});

describe('safeFetch', () => {
  it('fetches a public HTML page pinned to the checked address', async () => {
    const seen: string[] = [];
    const transport = fakeTransport({ 'https://recipes.test/pie': { html: '<p>pie</p>' } });
    const result = await safeFetch('https://recipes.test/pie?utm_source=x', {
      resolve,
      transport: async (req) => {
        seen.push(req.address);
        return transport(req);
      },
    });
    expect(result.finalUrl.href).toBe('https://recipes.test/pie');
    expect(result.html).toBe('<p>pie</p>');
    expect(seen).toEqual([PUBLIC_IP]);
  });

  it('decodes the declared charset', async () => {
    const body = new Uint8Array([0x63, 0x72, 0xe8, 0x6d, 0x65]);
    const transport = fakeTransport({
      'https://recipes.test/': { body, headers: { 'content-type': 'text/html; charset=iso-8859-1' } },
    });
    const result = await safeFetch('https://recipes.test/', { resolve, transport });
    expect(result.html).toBe('crème');
  });

  it('follows redirects and re-validates each hop', async () => {
    const transport = fakeTransport({
      'https://recipes.test/a': { status: 301, headers: { location: 'https://other.test/b' } },
      'https://other.test/b': { html: 'ok' },
    });
    const result = await safeFetch('https://recipes.test/a', { resolve, transport });
    expect(result.finalUrl.href).toBe('https://other.test/b');
    expect(transport.calls).toEqual(['https://recipes.test/a', 'https://other.test/b']);
  });

  it('rejects a redirect to a private address before connecting', async () => {
    const transport = fakeTransport({
      'https://recipes.test/a': { status: 302, headers: { location: 'http://internal.test/admin' } },
    });
    await expect(safeFetch('https://recipes.test/a', { resolve, transport })).rejects.toMatchObject({
      reason: 'url_not_allowed',
    });
    expect(transport.calls).toEqual(['https://recipes.test/a']);
  });

  it('caps the redirect chain', async () => {
    const transport = fakeTransport({
      'https://recipes.test/1': { status: 302, headers: { location: '/2' } },
      'https://recipes.test/2': { status: 302, headers: { location: '/3' } },
      'https://recipes.test/3': { status: 302, headers: { location: '/4' } },
      'https://recipes.test/4': { status: 302, headers: { location: '/5' } },
      'https://recipes.test/5': { html: 'too far' },
    });
    await expect(safeFetch('https://recipes.test/1', { resolve, transport })).rejects.toMatchObject({
      reason: 'url_not_allowed',
    });
  });

  it.each([
    ['private address', 'http://internal.test/'],
    ['any blocked answer among several', 'https://mixed.test/'],
    ['cloud metadata', 'http://metadata.test/latest/meta-data/'],
    ['no DNS answers', 'https://empty.test/'],
    ['unresolvable host', 'https://nowhere.test/'],
    ['non-default port', 'https://recipes.test:8080/'],
    ['credentials', 'https://user:pass@recipes.test/'],
    ['literal private IP', 'http://127.0.0.1/'],
    ['non-http scheme', 'file:///etc/passwd'],
  ])('rejects %s', async (_label, url) => {
    const transport = fakeTransport({});
    await expect(safeFetch(url, { resolve, transport })).rejects.toMatchObject({ reason: 'url_not_allowed' });
    expect(transport.calls).toEqual([]);
  });

  it('rejects non-HTML content', async () => {
    const transport = fakeTransport({
      'https://recipes.test/file.pdf': { headers: { 'content-type': 'application/pdf' } },
    });
    await expect(safeFetch('https://recipes.test/file.pdf', { resolve, transport })).rejects.toMatchObject({
      reason: 'url_not_allowed',
    });
  });

  it('treats an oversize body as an upstream error', async () => {
    const transport = fakeTransport({ 'https://recipes.test/': { html: 'x'.repeat(100) } });
    await expect(safeFetch('https://recipes.test/', { resolve, transport, maxBytes: 10 })).rejects.toMatchObject({
      reason: 'upstream_error',
    });
  });

  it('treats a non-2xx status as an upstream error', async () => {
    const transport = fakeTransport({ 'https://recipes.test/': { status: 500 } });
    await expect(safeFetch('https://recipes.test/', { resolve, transport })).rejects.toMatchObject({
      reason: 'upstream_error',
    });
  });

  it('maps transport failures to upstream_error', async () => {
    const transport = async () => {
      throw new Error('ECONNRESET');
    };
    await expect(safeFetch('https://recipes.test/', { resolve, transport })).rejects.toMatchObject({
      reason: 'upstream_error',
    });
  });

  it('maps an aborted fetch to timeout', async () => {
    const transport = (req: { signal: AbortSignal }) =>
      new Promise<never>((_resolve, reject) => {
        req.signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    await expect(safeFetch('https://recipes.test/', { resolve, transport, timeoutMs: 10 })).rejects.toMatchObject({
      reason: 'timeout',
    });
  });
});
