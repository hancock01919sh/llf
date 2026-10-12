import { describe, expect, it } from 'vitest';

import { isSiteBlocked } from './blocked';

const body = (text: string) => new TextEncoder().encode(text);
const empty = new Uint8Array();

describe('isSiteBlocked', () => {
  it.each([401, 403, 429, 451])('treats HTTP %i as blocked', (status) => {
    expect(isSiteBlocked(status, {}, empty)).toBe(true);
  });

  it.each([404, 410, 500, 502, 504])('leaves HTTP %i as an ordinary failure', (status) => {
    expect(isSiteBlocked(status, {}, body('Just a moment...'))).toBe(false);
  });

  it('detects a Cloudflare challenge by header on any status', () => {
    expect(isSiteBlocked(503, { 'cf-mitigated': 'challenge' }, empty)).toBe(true);
    expect(isSiteBlocked(200, { 'cf-mitigated': 'Challenge' }, empty)).toBe(true);
  });

  it.each([
    '<html><head><title>Just a moment...</title></head></html>',
    '<script src="/cdn-cgi/challenge-platform/h/b/orchestrate"></script>',
    '<iframe src="https://geo.captcha-delivery.com/x"></iframe>',
    '<div id="px-captcha"></div>',
    '<h1>Pardon Our Interruption</h1>',
    'Reference&#32;&#35;18 https://errors.edgesuite.net/18.1',
  ])('detects a challenge page on 200 and 503: %s', (html) => {
    expect(isSiteBlocked(200, {}, body(html))).toBe(true);
    expect(isSiteBlocked(503, {}, body(html))).toBe(true);
  });

  it('ignores markers on large real pages and on a plain 503', () => {
    const big = body(`px-captcha${' '.repeat(70 * 1024)}`);
    expect(isSiteBlocked(200, {}, big)).toBe(false);
    expect(isSiteBlocked(503, {}, body('<p>Service unavailable</p>'))).toBe(false);
    expect(isSiteBlocked(200, {}, body('<p>Chicken soup</p>'))).toBe(false);
  });
});
