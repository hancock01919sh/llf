import { describe, expect, it } from 'vitest';

import { clientIp } from './http';

const request = (forwarded?: string) =>
  new Request('http://tool.local/api/find-tips', {
    headers: forwarded ? { 'x-forwarded-for': forwarded } : {},
  });

describe('clientIp', () => {
  it('uses the socket address when no proxy is trusted', () => {
    expect(clientIp(request('198.51.100.1'), '10.0.0.5')).toBe('10.0.0.5');
  });

  it('takes the entry the trusted proxy appended, not a forged one to its left', () => {
    expect(clientIp(request('198.51.100.1, 203.0.113.7'), '10.0.0.5', 1)).toBe('203.0.113.7');
    expect(clientIp(request('198.51.100.1, 203.0.113.7, 10.1.1.1'), '10.0.0.5', 2)).toBe(
      '203.0.113.7',
    );
  });

  it('falls back to the socket address when the header is missing or too short', () => {
    expect(clientIp(request(), '10.0.0.5', 1)).toBe('10.0.0.5');
    expect(clientIp(request('203.0.113.7'), '10.0.0.5', 2)).toBe('10.0.0.5');
  });
});
