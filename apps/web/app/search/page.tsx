import type { Metadata } from 'next';
// import { strings } from '@/content/strings';
import { pageMetadata } from '@/lib/seo';
// import { SearchResults } from './SearchResults';
import { requirePage } from '@/lib/cms';
import { PageTemplate } from '@/templates/PageTemplate';
import { Suspense } from 'react';
const page = await requirePage('search');
/** Results depend on the fragment, so the page itself has nothing to index (TDD §6.5, §6.7). */
export const metadata: Metadata = pageMetadata({
  title: page.title,
  path: '/search/',
  noindex: true,
});

export default function SearchPage() {
  return (
    <Suspense fallback={<div></div>}>
      <PageTemplate page={page} />
    </Suspense>
  );
}
