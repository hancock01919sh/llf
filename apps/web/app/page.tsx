import type { Metadata } from 'next';
import { requirePage } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { PageTemplate } from '@/templates/PageTemplate';
const page = await requirePage('/');
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ title: page.title, path: '/', seo: page.seo });
}

export default async function HomePage() {
  return <PageTemplate page={page} />;
}
