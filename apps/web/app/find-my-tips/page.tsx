import type { Metadata } from 'next';
import { requirePage } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { PageTemplate } from '@/templates/PageTemplate';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await requirePage('find-my-tips');
  return pageMetadata({ title: page.title, path: '/find-my-tips/', seo: page.seo });
}

export default async function FindMyTipsPage() {
  const page = await requirePage('find-my-tips');
  return <PageTemplate page={page} />;
}
