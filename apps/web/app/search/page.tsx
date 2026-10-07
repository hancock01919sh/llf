import type { Metadata } from 'next';
import { strings } from '@/content/strings';
import { pageMetadata } from '@/lib/seo';
import { SearchResults } from './SearchResults';

/** Results depend on the fragment, so the page itself has nothing to index (TDD §6.5, §6.7). */
export const metadata: Metadata = pageMetadata({
  title: strings.search.pageTitle,
  path: '/search/',
  noindex: true,
});

export default function SearchPage() {
  return (
    <div className="mx-auto flex max-w-page flex-col gap-lg px-gutter py-xl lg:px-gutter-lg">
      <h1 className="font-display text-5xl uppercase">{strings.search.pageTitle}</h1>
      <SearchResults />
    </div>
  );
}
