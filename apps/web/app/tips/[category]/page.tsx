import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories, getCategory, requirePage } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { PageTemplate } from '@/templates/PageTemplate';
import { Suspense } from 'react';
const page = await requirePage('tips/category');
interface Params {
  params: Promise<{ category: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCategories()).map((category) => ({ category: category.slug }));
}

async function load({ params }: Params) {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  return category;
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const category = await load(props);
  return pageMetadata({
    title: category.title,
    path: `/tips/${category.slug}/`,
    seo: category.seo,
    description: category.description,
  });
}

/**
 * Tips category page (Figma Category frames).
 * TODO(BD3244-8): the designed layout, tip cards, and the Tip Modal.
 */
export default async function CategoryPage(props: Params) {
  // test url /tips/chicken-and-rice-bowls
  const category = await load(props);
  return (
    <Suspense fallback={<div>loading</div>}>
      <PageTemplate page={page} categoryData={category} />
    </Suspense>
  );
}
