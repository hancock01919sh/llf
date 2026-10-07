import { afterEach, describe, expect, it } from 'vitest';
import { pageTypeFor, track } from './analytics';

describe('track', () => {
  afterEach(() => {
    delete window.dataLayer;
  });

  it('queues events before GTM loads', () => {
    track({ event: 'cta_click', cta_label: 'Find my tips', cta_href: '/find-my-tips/' });
    expect(window.dataLayer).toEqual([{ event: 'cta_click', cta_label: 'Find my tips', cta_href: '/find-my-tips/' }]);
  });
});

describe('pageTypeFor', () => {
  it.each([
    ['/', 'home'],
    ['/find-my-tips/', 'tool'],
    ['/find-my-tips/results/', 'results'],
    ['/tips/', 'library'],
    ['/tips/fridge/', 'category'],
    ['/search/', 'search'],
    ['/about/', 'about'],
    ['/privacy/', 'page'],
  ])('%s → %s', (path, type) => {
    expect(pageTypeFor(path)).toBe(type);
  });
});
