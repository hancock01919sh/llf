import type { Metadata } from 'next';
import { requirePage } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
// import { templates } from '@/templates/registry';
import { PageTemplate } from '@/templates/PageTemplate';

// Static routes can't use ISR without prerendering at build time; render on every request
// and rely on the 60s in-memory cache in @/lib/cms for the ISR-equivalent revalidation (TDD D36).
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await requirePage('tips');
  return pageMetadata({ title: page.title, path: '/tips/', seo: page.seo });
}

export default async function TipsLibraryPage() {
  // const Template = templates.library;
  // return <Template page={await requirePage('tips')} />;
  const page = await requirePage('tips');
  return <PageTemplate page={page} />;
}
