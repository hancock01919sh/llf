import { describe, expect, it } from 'vitest';
import { ctaHref, isInternalHref, normalizePath, pageHref, resultsHref } from './paths';

describe('normalizePath', () => {
  it('treats slashes and whitespace the same', () => {
    expect(normalizePath('/about/')).toBe('about');
    expect(normalizePath(' about ')).toBe('about');
    expect(normalizePath('//tips/fridge//')).toBe('tips/fridge');
  });

  it('turns home into an empty string', () => {
    expect(normalizePath('/')).toBe('');
    expect(normalizePath('')).toBe('');
  });
});

describe('pageHref', () => {
  it('adds the trailing slash the static export uses', () => {
    expect(pageHref('about')).toBe('/about/');
    expect(pageHref('/tips/fridge')).toBe('/tips/fridge/');
    expect(pageHref('/')).toBe('/');
  });
});

describe('ctaHref', () => {
  const about = { id: 1, documentId: 'about01', title: 'About', path: '/about' };

  it('prefers the linked CMS page', () => {
    expect(ctaHref({ label: 'Go', page: about, href: 'https://adcouncil.org' })).toBe('/about/');
  });

  it('falls back to a trimmed href', () => {
    expect(ctaHref({ label: 'Go', href: '  https://adcouncil.org  ' })).toBe('https://adcouncil.org');
  });

  it('returns null when nothing is set', () => {
    expect(ctaHref({ label: 'Go', href: '   ' })).toBeNull();
    expect(ctaHref({ label: 'Go' })).toBeNull();
  });
});

describe('isInternalHref', () => {
  it('accepts site paths and rejects protocol-relative and absolute URLs', () => {
    expect(isInternalHref('/tips/')).toBe(true);
    expect(isInternalHref('//evil.example/')).toBe(false);
    expect(isInternalHref('https://longlivefood.org/')).toBe(false);
  });
});

describe('resultsHref', () => {
  it('puts slugs in ?i=', () => {
    expect(resultsHref(['banana', 'bread'])).toBe('/find-my-tips/results/?i=banana,bread');
  });
});
