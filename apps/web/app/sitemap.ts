import type { MetadataRoute } from 'next';
import { getCategories, getPages, normalizePath } from '@/lib/cms';
import { absoluteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

/** Every CMS page and category. Results and search are per-visitor and left out (TDD §6.7). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, categories] = await Promise.all([getPages(), getCategories()]);
  return [
    ...pages.map((page) => ({ url: absoluteUrl(`/${normalizePath(page.path)}`) })),
    ...categories.map((category) => ({ url: absoluteUrl(`/tips/${category.slug}/`) })),
  ];
}
