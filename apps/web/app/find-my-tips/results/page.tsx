import type { Metadata } from 'next';
// import { Suspense } from 'react';
import { strings } from '@/content/strings';
import { pageMetadata } from '@/lib/seo';
// import { ResultsView } from './ResultsView';
import { requirePage } from '@/lib/cms';
import { PageTemplate } from '@/templates/PageTemplate';
const page = await requirePage('/find-my-tips/results/');
/** Results are per-visitor, so the page is never indexed (TDD §6.7). */
export const metadata: Metadata = pageMetadata({
  title: strings.results.pageTitle,
  path: '/find-my-tips/results/',
  noindex: true,
});

export default function ResultsPage() {
  return <PageTemplate page={page} />;
}
