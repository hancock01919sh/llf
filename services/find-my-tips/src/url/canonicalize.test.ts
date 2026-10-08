import { describe, expect, it } from 'vitest';

import { canonicalizeUrl, sha256Hex } from './canonicalize';

describe('canonicalizeUrl', () => {
  it('strips tracking params, sorts the query, and drops the hash', () => {
    const url = canonicalizeUrl(
      'https://Example.com/recipe?z=1&utm_source=x&UTM_Medium=y&fbclid=abc&a=2&mc_cid=q#step-3',
    );
    expect(url?.href).toBe('https://example.com/recipe?a=2&z=1');
  });

  it('drops an empty query', () => {
    expect(canonicalizeUrl('https://example.com/r?gclid=1')?.href).toBe('https://example.com/r');
  });

  it.each(['ftp://example.com/r', 'https://user:pass@example.com/r', 'javascript:alert(1)', 'not a url', ''])(
    'rejects %s',
    (input) => {
      expect(canonicalizeUrl(input)).toBeNull();
    },
  );
});

describe('sha256Hex', () => {
  it('returns a stable 64-char hex digest', () => {
    const digest = sha256Hex('https://example.com/r');
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Hex('https://example.com/r')).toBe(digest);
  });
});
