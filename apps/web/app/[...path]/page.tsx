import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageByPath, getPages, normalizePath } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { templateFor } from '@/templates/registry';

/** Paths with their own route. A CMS page at one of these renders there, not here (TDD §6.1). */
const RESERVED = ['', 'find-my-tips', 'tips', 'search'];

function isReserved(path: string): boolean {
  return RESERVED.some(
    (reserved) => path === reserved || (reserved && path.startsWith(`${reserved}/`)),
  );
}

interface Params {
  params: Promise<{ path: string[] }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const pages = await getPages();
  return pages
    .map((page) => normalizePath(page.path))
    .filter((path) => !isReserved(path))
    .map((path) => ({ path: path.split('/') }));
}

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
  const Template = templateFor(page);
  return <Template page={page} />;
}
