import type { Metadata } from 'next';
import { strings } from '@/content/strings';
import { pageMetadata } from '@/lib/seo';
import { SearchResults } from './SearchResults';
import { requirePage } from '@/lib/cms';
import { PageTemplate } from '@/templates/PageTemplate';
const page = await requirePage('search');
/** Results depend on the fragment, so the page itself has nothing to index (TDD §6.5, §6.7). */
export const metadata: Metadata = pageMetadata({
  title: strings.search.pageTitle,
  path: '/search/',
  noindex: true,
});

export default function SearchPage() {
  return <PageTemplate page={page} />;
}
