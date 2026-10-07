import { z } from 'zod';

/**
 * The catalog snapshot (`/data/catalog.json`) that ships with each release (TDD §5.3, §7.5).
 * The matcher reads only published titles, slugs, and synonyms.
 */
export const CatalogIngredient = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  synonyms: z.array(z.string().min(1)).default([]),
  plural: z.string().min(1).optional(),
});
export type CatalogIngredient = z.infer<typeof CatalogIngredient>;

export const Catalog = z.object({
  catalogVersion: z.string().min(1),
  ingredients: z.array(CatalogIngredient),
});
export type Catalog = z.infer<typeof Catalog>;

/** `?i=` on the results page is capped at 30 slugs (TDD §6.1). */
export const RESULTS_MAX_SLUGS = 30;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const Slug = z.string().regex(SLUG_PATTERN);

/**
 * Ingredients have no slug field yet, so the build derives one from the title (TDD §5.2).
 * TODO(BD3244-11): replace with a stored, unique `slug` on Ingredient so renames don't break `?i=` links.
 */
export function toSlug(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** `/data/ingredients/<slug>.json`, fetched by the results page from the same release (TDD §7.2). */
export const IngredientTip = z.object({
  documentId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  type: z.string().nullable(),
});
export type IngredientTip = z.infer<typeof IngredientTip>;

export const IngredientData = z.object({
  slug: Slug,
  title: z.string().min(1),
  wasted: z.number().int().min(1).max(5),
  image: z.object({ url: z.string().min(1), alt: z.string() }).nullable(),
  tips: z.array(IngredientTip),
});
export type IngredientData = z.infer<typeof IngredientData>;

/** Parses `?i=a,b,c`: keeps valid, unique slugs in order and caps the list (TDD §6.1). */
export function parseResultSlugs(value: string | null | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  for (const raw of value.split(',')) {
    const slug = raw.trim().toLowerCase();
    if (SLUG_PATTERN.test(slug)) seen.add(slug);
    if (seen.size >= RESULTS_MAX_SLUGS) break;
  }
  return [...seen];
}
