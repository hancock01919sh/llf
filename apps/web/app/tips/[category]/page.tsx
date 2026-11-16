import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories, getCategory, requirePage } from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { PageTemplate } from '@/templates/PageTemplate';
import { Suspense } from 'react';
interface Params {
  params: Promise<{ category: string }>;
}

export const revalidate = 60;

// A category created after the build renders on first request instead of 404-ing (TDD D36).
export const dynamicParams = true;

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
  const [category, page] = await Promise.all([load(props), requirePage('tips/category')]);
  return (
    <Suspense fallback={<div>loading</div>}>
      <PageTemplate page={page} categoryData={category} />
    </Suspense>
  );
}
