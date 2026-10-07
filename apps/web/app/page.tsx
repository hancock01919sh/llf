import type { Metadata } from 'next';
import { requirePage } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { templates } from '@/templates/registry';

export async function generateMetadata(): Promise<Metadata> {
  const page = await requirePage('/');
  return pageMetadata({ title: page.title, path: '/', seo: page.seo });
}

export default async function HomePage() {
  const Template = templates.home;
  return <Template page={await requirePage('/')} />;
}
