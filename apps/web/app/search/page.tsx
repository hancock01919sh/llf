import type { Metadata } from 'next';
// import { strings } from '@/content/strings';
import { pageMetadata } from '@/lib/seo';
// import { SearchResults } from './SearchResults';
import { requirePage } from '@/lib/cms';
import { PageTemplate } from '@/templates/PageTemplate';
import { Suspense } from 'react';

// Static routes can't use ISR without prerendering at build time; render on every request
// and rely on the 60s in-memory cache in @/lib/cms for the ISR-equivalent revalidation (TDD D36).
export const dynamic = 'force-dynamic';

/** Results depend on the fragment, so the page itself has nothing to index (TDD §6.5, §6.7). */
export async function generateMetadata(): Promise<Metadata> {
  const page = await requirePage('search');
  return pageMetadata({
    title: page.title,
    path: '/search/',
    noindex: true,
  });
}

export default async function SearchPage() {
  const page = await requirePage('search');
  return (
    <Suspense fallback={<div></div>}>
      <PageTemplate page={page} />
    </Suspense>
  );
}
