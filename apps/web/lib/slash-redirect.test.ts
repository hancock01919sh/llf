import { describe, expect, it } from 'vitest';
import { slashRedirect } from './slash-redirect.mjs';

describe('slashRedirect', () => {
  it('adds the trailing slash and keeps the query', () => {
    expect(slashRedirect('/about')).toBe('/about/');
    expect(slashRedirect('/find-my-tips/results?i=banana,milk')).toBe(
      '/find-my-tips/results/?i=banana,milk',
    );
    expect(slashRedirect('/find-my-tips/results?i=banana%2Cmilk&x=')).toBe(
      '/find-my-tips/results/?i=banana%2Cmilk&x=',
    );
  });

  it('leaves slash URLs and files alone', () => {
    expect(slashRedirect('/')).toBeNull();
    expect(slashRedirect('/about/')).toBeNull();
    expect(slashRedirect('/find-my-tips/results/?i=banana')).toBeNull();
    expect(slashRedirect('/data/catalog.json')).toBeNull();
    expect(slashRedirect('/data/catalog.json?v=1')).toBeNull();
    expect(slashRedirect('/_next/static/chunks/main.js')).toBeNull();
    expect(slashRedirect('/robots.txt')).toBeNull();
  });

  it('ignores a dot in the query, not the path', () => {
    expect(slashRedirect('/about?ref=a.b')).toBe('/about/?ref=a.b');
  });

  it('never redirects off-site', () => {
    expect(slashRedirect('//evil')).toBe('/evil/');
    expect(slashRedirect('///evil?x=1')).toBe('/evil/?x=1');
    expect(slashRedirect('/\\evil')).toBe('/evil/');
  });

  it('returns null without a URL', () => {
    expect(slashRedirect(undefined)).toBeNull();
    expect(slashRedirect('')).toBeNull();
  });
});
