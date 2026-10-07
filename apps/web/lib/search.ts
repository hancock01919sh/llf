import { normalize } from '@llf/matching';
import type { Options } from 'minisearch';

/**
 * Site search (TDD §6.5). The build writes the index to `/data/search-index.json`; the browser loads
 * it on first focus. Build and browser must use the same options, so both import them from here.
 */

export const SEARCH_INDEX_PATH = '/data/search-index.json';

export type SearchKind = 'ingredient' | 'tip';

export interface SearchDocument {
  id: string;
  kind: SearchKind;
  title: string;
  /** Extra words that should find the document (synonyms, tip text). Indexed, not stored. */
  body: string;
  href: string;
}

export type StoredFields = Pick<SearchDocument, 'kind' | 'title' | 'href'>;

/** Same `normalize()` as the tool's matcher, so "Tomatoes" finds "tomato" (TDD §7.5). */
export function processTerm(term: string): string | null {
  return normalize(term) || null;
}

export const SEARCH_OPTIONS: Options<SearchDocument> = {
  idField: 'id',
  fields: ['title', 'body'],
  storeFields: ['kind', 'title', 'href'],
  processTerm,
  searchOptions: {
    boost: { title: 3 },
    prefix: true,
    fuzzy: 0.2,
    combineWith: 'AND',
  },
};

export const SEARCH_PATH = '/search/';
export const SEARCH_TERM_MAX_LENGTH = 100;

/** The term rides in the fragment, which browsers never send to the CDN or WAF logs (TDD §6.5, §7.6). */
export function searchHref(term: string): string {
  const clean = term.trim().slice(0, SEARCH_TERM_MAX_LENGTH);
  return clean ? `${SEARCH_PATH}#q=${encodeURIComponent(clean)}` : SEARCH_PATH;
}

export function readSearchHash(hash: string): string {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return (params.get('q') ?? '').trim().slice(0, SEARCH_TERM_MAX_LENGTH);
}
