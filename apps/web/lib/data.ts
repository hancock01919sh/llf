import { createHash } from 'node:crypto';
import {
  Catalog,
  IngredientData,
  toSlug,
  type CatalogIngredient,
  type cms,
} from '@llf/contracts';
import MiniSearch from 'minisearch';
import { ContentError, getIngredients, getTips } from './cms';
import { mediaUrl } from './media';
import { resultsHref } from './paths';
import { SEARCH_OPTIONS, type SearchDocument } from './search';

/**
 * Release data derived from the CMS at build time (TDD §6.2, §7.2): the matcher's catalog, one JSON
 * file per ingredient for the results page, and the site-search index. All three ship together, so
 * the tool, results page, and search always agree on the catalog version.
 */

function splitSynonyms(value: string | null | undefined): string[] {
  if (!value) return [];
  return [...new Set(value.split(',').map((s) => s.trim()).filter(Boolean))];
}

export interface SluggedIngredient {
  slug: string;
  ingredient: cms.Ingredient;
}

/** Slugs come from titles until Ingredient has a slug field (BD3244-11). Collisions fail the build. */
export function slugIngredients(ingredients: cms.Ingredient[]): SluggedIngredient[] {
  const bySlug = new Map<string, cms.Ingredient>();
  for (const ingredient of ingredients) {
    const slug = toSlug(ingredient.title);
    if (!slug) {
      throw new ContentError(
        `Ingredient "${ingredient.title}" (documentId ${ingredient.documentId}) needs a title with letters or numbers.`,
      );
    }
    const clash = bySlug.get(slug);
    if (clash) {
      throw new ContentError(
        `Ingredients "${clash.title}" and "${ingredient.title}" both become "${slug}". Rename one in Strapi so each title is unique.`,
      );
    }
    bySlug.set(slug, ingredient);
  }
  return [...bySlug].map(([slug, ingredient]) => ({ slug, ingredient }));
}

export function buildCatalog(ingredients: cms.Ingredient[]): Catalog {
  const items: CatalogIngredient[] = slugIngredients(ingredients)
    .map(({ slug, ingredient }) => ({
      slug,
      title: ingredient.title,
      synonyms: splitSynonyms(ingredient.synonyms),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const catalogVersion = createHash('sha256')
    .update(JSON.stringify(items))
    .digest('hex')
    .slice(0, 12);
  return Catalog.parse({ catalogVersion, ingredients: items });
}

export function toIngredientData({ slug, ingredient }: SluggedIngredient): IngredientData {
  return IngredientData.parse({
    slug,
    title: ingredient.title,
    wasted: ingredient.wasted,
    image: ingredient.image
      ? { url: mediaUrl(ingredient.image.url), alt: ingredient.image.alternativeText ?? '' }
      : null,
    tips: (ingredient.tips ?? []).map((tip) => ({
      documentId: tip.documentId,
      title: tip.title,
      description: tip.description ?? null,
      type: tip.tip_type?.title ?? null,
    })),
  });
}

export function buildSearchDocuments(
  ingredients: cms.Ingredient[],
  tips: cms.Tip[],
): SearchDocument[] {
  const slugs = slugIngredients(ingredients);
  const slugByDocumentId = new Map(slugs.map((s) => [s.ingredient.documentId, s.slug]));
  return [
    ...slugs.map(({ slug, ingredient }) => ({
      id: `ingredient:${slug}`,
      kind: 'ingredient' as const,
      title: ingredient.title,
      body: splitSynonyms(ingredient.synonyms).join(' '),
      href: resultsHref([slug]),
    })),
    ...tips.map((tip) => {
      const slug = tip.ingredient ? slugByDocumentId.get(tip.ingredient.documentId) : undefined;
      return {
        id: `tip:${tip.documentId}`,
        kind: 'tip' as const,
        title: tip.title,
        body: [tip.description, tip.ingredient?.title].filter(Boolean).join(' '),
        // TODO(BD3244-8): link to the tip itself once the Tip Modal has a deep link (TDD D22).
        href: slug ? resultsHref([slug]) : '/tips/',
      };
    }),
  ];
}

export function buildSearchIndex(documents: SearchDocument[]): string {
  const index = new MiniSearch<SearchDocument>(SEARCH_OPTIONS);
  index.addAll(documents);
  return JSON.stringify(index);
}

export async function getSluggedIngredients(): Promise<SluggedIngredient[]> {
  return slugIngredients(await getIngredients());
}

export async function getCatalog(): Promise<Catalog> {
  return buildCatalog(await getIngredients());
}

export async function getSearchIndexJson(): Promise<string> {
  return buildSearchIndex(buildSearchDocuments(await getIngredients(), await getTips()));
}
