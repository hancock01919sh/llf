import type { Metadata } from 'next';
import {
  getCategories,
  getCategory,
  getIngredientType,
  getIngredientTypes,
  requirePage,
} from '@/lib/cms';
import { pageMetadata } from '@/lib/seo';
import { PageTemplate } from '@/templates/PageTemplate';
import { Suspense } from 'react';
import type { cmsType } from '@llf/contracts';
import { notFound } from 'next/navigation';
const page = await requirePage('tips/category');
interface Params {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ type?: 'category' | 'ingredientType' }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const [categories, ingredientTypes] = await Promise.all([getCategories(), getIngredientTypes()]);
  return [...categories, ...ingredientTypes].map((entry) => ({ category: entry.slug }));
}

async function load({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (category) return { ...category, DataType: 'category' as const };
  const ingredientType = await getIngredientType(slug);
  if (!ingredientType) notFound();
  return { ...ingredientType, DataType: 'ingredient-type' as const };
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const category = await load(props);
  return pageMetadata({
    title: category.title,
    path: `/tips/${category.slug}/`,
    seo: category.seo,
    description:
      category['DataType'] === 'ingredient-type'
        ? category.title
        : (category as cmsType.api.Category)?.description || category.title,
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
