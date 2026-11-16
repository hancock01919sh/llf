import type { Metadata } from 'next';
// import { Suspense } from 'react';
import { strings } from '@/content/strings';
import { pageMetadata } from '@/lib/seo';
// import { ResultsView } from './ResultsView';
import { requirePage } from '@/lib/cms';
import { PageTemplate } from '@/templates/PageTemplate';
import { Suspense } from 'react';

export const revalidate = 60;

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
