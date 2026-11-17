import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageByPath } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { PageTemplate } from '@/templates/PageTemplate';

interface Params {
  params: Promise<{ path: string[] }>;
}

// This route can call notFound(), which renders the dynamic not-found boundary. A static ISR
// route can't switch to dynamic at runtime, so force dynamic and let @/lib/cms cache for 60s.
export const dynamic = 'force-dynamic';

// A page created after the build renders on first request instead of 404-ing (TDD D36).
export const dynamicParams = true;

async function load({ params }: Params) {
  const { path } = await params;
  const page = await getPageByPath(path.join('/'));
  if (!page) notFound();
  return page;
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const page = await load(props);
  return pageMetadata({ title: page.title, path: page.path, seo: page.seo });
}

export default async function CmsPage(props: Params) {
  const page = await load(props);
  return <PageTemplate page={page} />;
  // const Template = templateFor(page);
  // return <Template page={page} />;
}
