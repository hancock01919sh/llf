'use client';
import { useEffect, useMemo, useState } from 'react';
import type { BlockProps } from '../types';
import { IngredientsHeader } from '@/blocks/CategoryDetail.tsx/IngredientsHeader';
import { IngredientsList } from '@/blocks/CategoryDetail.tsx/IngredientsList';
import { track } from '@/lib/analytics';
import {
  readSearchHash,
  SEARCH_INDEX_PATH,
  SEARCH_OPTIONS,
  searchHref,
  type SearchDocument,
  type StoredFields,
} from '@/lib/search';
import MiniSearch from 'minisearch';
import type { CategoryDetailProps } from '../CategoryDetail.tsx';
type IndexState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; data: SearchDocument[]; index: MiniSearch<SearchDocument> };
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
    tips: hit.tips as StoredFields['tips'],
    image: hit.image as StoredFields['image'],
  }));
}
export function SearchBlock(props: BlockProps<CategoryDetailProps>) {
  async function searchIngredients(query: string) {
    if (!query) return;
    window.location.hash = searchHref(query).replace(/^[^#]*/, '');
  }
  const [term, setTerm] = useState<string | null>(null);
  const [state, setState] = useState<IndexState>({ status: 'loading' });

  useEffect(() => {
    const read = () => {
      setTerm(readSearchHash(window.location.hash));
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(SEARCH_INDEX_PATH)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((json) => {
        if (!cancelled) {
          const index = new MiniSearch<SearchDocument>(SEARCH_OPTIONS);
          index.addAll(json);
          setState({
            status: 'ready',
            data: json,
            index,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  // 默认取八个，如果hit有，就从其他所有数据里补齐8个并随机排序，但是要排除掉hit里的重复项
  const max_count = 8;
  const hits = useMemo(() => {
    if (state.status !== 'ready') return [];
    if (!term) return state.data.slice(0, max_count);
    const _hits = runSearch(state.index, term);
    if (_hits.length >= max_count) return _hits.slice(0, max_count);
    const extra = state.data
      .filter((hit) => _hits.filter((h) => h.id === hit.id).length === 0)
      .sort(() => Math.random() - 0.5);
    return [..._hits, ...extra.slice(0, max_count - _hits.length)];
  }, [state, term]);

  useEffect(() => {
    if (state.status !== 'ready' || !term) return;
    track({ event: 'site_search', results_count: hits.length, has_results: hits.length > 0 });
  }, [state.status, term, hits.length]);

  return (
    <>
      <IngredientsHeader {...props.block} Background_color={'paper'} onSearch={searchIngredients} />
      <IngredientsList
        {...props.block}
        Background_color={'paper'}
        ingredients={hits as SearchDocument[]}
      />
    </>
  );
}
