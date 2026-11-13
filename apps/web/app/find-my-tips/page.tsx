import type { Metadata } from 'next';
import { requirePage } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { PageTemplate } from '@/templates/PageTemplate';

export const revalidate = 60;

const page = await requirePage('find-my-tips');
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ title: page.title, path: '/find-my-tips/', seo: page.seo });
}

export default async function FindMyTipsPage() {
  return <PageTemplate page={page} />;
}
