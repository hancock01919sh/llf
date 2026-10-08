'use client';

import MiniSearch from 'minisearch';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { format, strings } from '@/content/strings';
import { track } from '@/lib/analytics';
import {
  readSearchHash,
  SEARCH_INDEX_PATH,
  SEARCH_OPTIONS,
  searchHref,
  type SearchDocument,
  type StoredFields,
} from '@/lib/search';

type IndexState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; index: MiniSearch<SearchDocument> };

export interface SearchHit extends StoredFields {
  id: string;
}

export function runSearch(index: MiniSearch<SearchDocument>, term: string): SearchHit[] {
  if (!term) return [];
  return index.search(term).map((hit) => ({
    id: String(hit.id),
    kind: hit.kind as StoredFields['kind'],
    title: String(hit.title),
    href: String(hit.href),
  }));
}

/**
 * Client-side site search over the build-time index (TDD §6.5). The term lives in `#q=` and is
 * never sent anywhere; `site_search` carries counts only (TDD §8).
 */
export function SearchResults() {
  const [term, setTerm] = useState<string | null>(null);
  const [state, setState] = useState<IndexState>({ status: 'loading' });

  useEffect(() => {
    const read = () => setTerm(readSearchHash(window.location.hash));
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(SEARCH_INDEX_PATH)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.text();
      })
      .then((json) => {
        if (!cancelled)
          setState({ status: 'ready', index: MiniSearch.loadJSON(json, SEARCH_OPTIONS) });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hits = useMemo(
    () => (state.status === 'ready' && term ? runSearch(state.index, term) : []),
    [state, term],
  );

  useEffect(() => {
    if (state.status !== 'ready' || !term) return;
    track({ event: 'site_search', results_count: hits.length, has_results: hits.length > 0 });
  }, [state.status, term, hits.length]);

  if (term === null) return null;

  return (
    <div className="flex flex-col gap-md">
      <SearchForm
        initialTerm={term}
        onSearch={(next) => {
          window.location.hash = searchHref(next).replace(/^[^#]*/, '');
        }}
      />
      <div role="status" aria-live="polite" className="text-paragraph">
        {state.status === 'loading'
          ? strings.search.loading
          : state.status === 'unavailable'
            ? strings.search.unavailable
            : !term
              ? strings.search.empty
              : hits.length === 0
                ? strings.search.noResults
                : format(strings.search.resultsCount, { count: hits.length })}
      </div>
      {hits.length > 0 ? (
        <ul className="flex flex-col gap-sm">
          {hits.map((hit) => (
            <li key={hit.id}>
              <Link href={hit.href} className="text-xl underline underline-offset-4">
                {hit.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
