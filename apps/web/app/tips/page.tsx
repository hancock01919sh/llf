import type { Metadata } from 'next';
import { requirePage } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
// import { templates } from '@/templates/registry';
import { PageTemplate } from '@/templates/PageTemplate';
const page = await requirePage('tips');
export async function generateMetadata(): Promise<Metadata> {
  // const page = await requirePage('tips');
  return pageMetadata({ title: page.title, path: '/tips/', seo: page.seo });
}

export default async function TipsLibraryPage() {
  // const Template = templates.library;
  // return <Template page={await requirePage('tips')} />;
  return <PageTemplate page={page} />;
}
