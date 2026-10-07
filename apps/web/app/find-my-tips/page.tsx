import type { Metadata } from 'next';
import { requirePage } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { templates } from '@/templates/registry';

export async function generateMetadata(): Promise<Metadata> {
  const page = await requirePage('find-my-tips');
  return pageMetadata({ title: page.title, path: '/find-my-tips/', seo: page.seo });
}

export default async function FindMyTipsPage() {
  const Template = templates['find-my-tips'];
  return <Template page={await requirePage('find-my-tips')} />;
}
