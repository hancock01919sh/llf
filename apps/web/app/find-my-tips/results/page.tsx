import type { Metadata } from 'next';
// import { Suspense } from 'react';
import { strings } from '@/content/strings';
import { pageMetadata } from '@/lib/seo';
// import { ResultsView } from './ResultsView';
import { requirePage } from '@/lib/cms';
import { PageTemplate } from '@/templates/PageTemplate';
import { Suspense } from 'react';

// Static routes can't use ISR without prerendering at build time; render on every request
// and rely on the 60s in-memory cache in @/lib/cms for the ISR-equivalent revalidation (TDD D36).
export const dynamic = 'force-dynamic';

/** Results are per-visitor, so the page is never indexed (TDD §6.7). */
export const metadata: Metadata = pageMetadata({
  title: strings.results.pageTitle,
  path: '/find-my-tips/results/',
  noindex: true,
});

export default async function ResultsPage() {
  const page = await requirePage('/find-my-tips/results/');
  return (
    <Suspense fallback={<div></div>}>
      <PageTemplate page={page} />
    </Suspense>
  );
}
