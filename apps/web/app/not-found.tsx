import type { Metadata } from 'next';
import { strings } from '@/content/strings';
import { PageTemplate } from '@/templates/PageTemplate';
import { requirePage } from '@/lib/cms';
const page = await requirePage('404');
export const metadata: Metadata = {
  title: strings.notFound.title,
  robots: { index: false, follow: false },
};

/** The 404 page is a site string, not CMS content (TDD D21). == */
export default function NotFound() {
  return <PageTemplate page={page} />;
}
