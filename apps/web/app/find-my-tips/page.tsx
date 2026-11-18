import type { Metadata } from 'next';
import { requirePage } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { PageTemplate } from '@/templates/PageTemplate';

// Static routes can't use ISR without prerendering at build time; render on every request
// and rely on the 60s in-memory cache in @/lib/cms for the ISR-equivalent revalidation (TDD D36).
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await requirePage('find-my-tips');
  return pageMetadata({ title: page.title, path: '/find-my-tips/', seo: page.seo });
}

export default async function FindMyTipsPage() {
  const page = await requirePage('find-my-tips');
  return <PageTemplate page={page} />;
}
