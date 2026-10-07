import { describe, expect, it } from 'vitest';
import { sanitizePageLocation } from './analytics';

describe('sanitizePageLocation', () => {
  it('keeps origin and path', () => {
    expect(sanitizePageLocation('https://example.org/library/dairy/')).toBe(
      'https://example.org/library/dairy/',
    );
  });

  it('keeps i, utm_*, and gclid', () => {
    expect(
      sanitizePageLocation(
        'https://example.org/results/?i=milk&i=bread&utm_source=psa&utm_campaign=x&gclid=abc',
      ),
    ).toBe('https://example.org/results/?i=milk&i=bread&utm_source=psa&utm_campaign=x&gclid=abc');
  });

  it('drops other params and the fragment', () => {
    expect(
      sanitizePageLocation('https://example.org/search/?q=leftover+rice&email=a%40b.c#q=rice'),
    ).toBe('https://example.org/search/');
  });

  it('drops a submitted recipe URL passed as a param', () => {
    expect(
      sanitizePageLocation(
        'https://example.org/find-my-tips/?url=https%3A%2F%2Frecipes.example%2Fx&i=milk',
      ),
    ).toBe('https://example.org/find-my-tips/?i=milk');
  });
});
