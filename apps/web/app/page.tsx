import type { Metadata } from 'next';
import { requirePage } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { PageTemplate } from '@/templates/PageTemplate';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await requirePage('/');
  return pageMetadata({ title: page.title, path: '/', seo: page.seo });
}

export default async function HomePage() {
  // Read on every render, so a CMS publish reaches the page on the next ISR revalidation (D36).
  const page = await requirePage('/');
  return <PageTemplate page={page} />;
}
