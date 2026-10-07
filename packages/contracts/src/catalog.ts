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
