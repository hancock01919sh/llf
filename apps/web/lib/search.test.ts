import { describe, expect, it } from 'vitest';
import { processTerm, readSearchHash, SEARCH_PATH, SEARCH_TERM_MAX_LENGTH, searchHref } from './search';

describe('searchHref / readSearchHash', () => {
  it('keeps the term in the fragment, never the query string', () => {
    const href = searchHref('  brown bananas ');
    expect(href).toBe('/search/#q=brown%20bananas');
    expect(href).not.toContain('?');
  });

  it('round-trips terms with reserved characters', () => {
    const term = 'mac & cheese #2 / 50%';
    const href = searchHref(term);
    expect(readSearchHash(href.slice(href.indexOf('#')))).toBe(term);
  });

  it('links to the bare search page for an empty term', () => {
    expect(searchHref('   ')).toBe(SEARCH_PATH);
    expect(readSearchHash('')).toBe('');
    expect(readSearchHash('#other=1')).toBe('');
  });

  it('caps the term length both ways', () => {
    const long = 'a'.repeat(SEARCH_TERM_MAX_LENGTH + 50);
    expect(readSearchHash(searchHref(long).split('#')[1] ?? '')).toHaveLength(SEARCH_TERM_MAX_LENGTH);
    expect(readSearchHash(`#q=${long}`)).toHaveLength(SEARCH_TERM_MAX_LENGTH);
  });
});

describe('processTerm', () => {
  it('normalizes like the matcher and drops empty terms', () => {
    expect(processTerm('Bananas')).toBe(processTerm('banana'));
    expect(processTerm('  ')).toBeNull();
  });
});
