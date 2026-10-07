import type { Metadata } from 'next';
import { Suspense } from 'react';
import { strings } from '@/content/strings';
import { pageMetadata } from '@/lib/seo';
import { ResultsView } from './ResultsView';

/** Results are per-visitor, so the page is never indexed (TDD §6.7). */
export const metadata: Metadata = pageMetadata({
  title: strings.results.pageTitle,
  path: '/find-my-tips/results/',
  noindex: true,
});

export default function ResultsPage() {
  return (
    <div className="mx-auto flex max-w-page flex-col gap-lg px-gutter py-xl lg:px-gutter-lg">
      <Suspense fallback={<p role="status">{strings.results.loading}</p>}>
        <ResultsView />
      </Suspense>
    </div>
  );
}
