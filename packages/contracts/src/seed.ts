import { z } from 'zod';
import { Slug, toSlug } from './catalog';
import {
  // CAROUSEL_LAYOUTS,
  CAROUSEL_MODES,
  CATEGORY_MODES,
  BACKGROUND_COLOR,
  // HERO_LAYOUTS,
  HeadingLevel,
  INGREDIENT_TYPES,
  // LINK_LIST_LAYOUTS,
  // PAGE_TEMPLATES,
  // type PageTemplate,
  // TEASER_LAYOUTS,
  // TIP_LIST_LAYOUTS,
} from './cms';

/**
 * Seed fixtures for an empty Strapi (TDD §5.5). Hand-edited JSON in `scripts/seed/fixtures/`, so every
 * object is strict: a typo'd key fails validation instead of being dropped. Relations are written as
 * natural keys (ingredient slug, tip title, category slug, page path) and resolved to documentIds by
 * the seed script. Synthetic content only; no real data or secrets.
 */

export const SEED_VERSION = 1;

const text = z.string().trim().min(1);

/** Page paths as stored in Strapi: `/` for home, otherwise lowercase segments without slashes at either end. */
export const SEED_PATH_PATTERN = /^(?:\/|[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)$/;
export const SeedPath = z.string().regex(SEED_PATH_PATTERN);

/** Compares page paths the way the web build does (`apps/web/lib/paths.ts`): slashes at either end are ignored. */
export function pathKey(path: string): string {
  return path.replace(/^\/+|\/+$/g, '');
}

/** Rich text as plain paragraphs; converted to Strapi `blocks` by `toBlocks`. */
export const SeedRichText = z.array(text);
export type SeedRichText = z.infer<typeof SeedRichText>;

export function toBlocks(paragraphs: readonly string[]) {
  return paragraphs.map((paragraph) => ({
    type: 'paragraph' as const,
    children: [{ type: 'text' as const, text: paragraph }],
  }));
}

// Shared components
export const SeedTitle = z.strictObject({
  copy: text,
  header: HeadingLevel.default('h3'),
});
export type SeedTitle = z.infer<typeof SeedTitle>;

/** A CTA links to a CMS page by path, or to an external `href`. Exactly one of the two. */
export const SeedCta = z
  .strictObject({
    label: text,
    page: SeedPath.optional(),
    href: z.url({ protocol: /^https?$/ }).optional(),
  })
  .refine((cta) => (cta.page === undefined) !== (cta.href === undefined), {
    message: 'Set exactly one of `page` or `href`',
  });
export type SeedCta = z.infer<typeof SeedCta>;

export const SeedSeo = z.strictObject({
  metaTitle: text.optional(),
  metaDescription: text.optional(),
});
export type SeedSeo = z.infer<typeof SeedSeo>;

// Taxonomies
export const SeedTaxonomy = z.strictObject({ title: text });
export type SeedTaxonomy = z.infer<typeof SeedTaxonomy>;

export const SeedTaxonomies = z.strictObject({
  tip_types: z.array(SeedTaxonomy),
  tip_behaviors: z.array(SeedTaxonomy),
  tip_motivators: z.array(SeedTaxonomy),
});
export type SeedTaxonomies = z.infer<typeof SeedTaxonomies>;

// Collections
/** Keyed by `toSlug(title)`, the same slug the catalog and `?i=` links use (TDD §5.3). */
export const SeedIngredient = z.strictObject({
  title: text,
  type: z.enum(INGREDIENT_TYPES).optional(),
  /** Written to Strapi as one comma-separated string (TDD §5.2), so a synonym can't contain a comma. */
  synonyms: z
    .array(text.refine((s) => !s.includes(','), 'Synonyms cannot contain commas'))
    .default([]),
  wasted: z.number().int().min(1).max(5).default(3),
});
export type SeedIngredient = z.infer<typeof SeedIngredient>;

/** Keyed by title. One ingredient per tip until OPEN-14 is decided (TDD §5.2). */
export const SeedTip = z.strictObject({
  title: text,
  description: text.optional(),
  type: text.optional(),
  behavior: text.optional(),
  motivator: text.optional(),
  ingredient: Slug.optional(),
});
export type SeedTip = z.infer<typeof SeedTip>;

/** Keyed by title. */
export const SeedGroup = z.strictObject({
  title: text,
  description: text,
});
export type SeedGroup = z.infer<typeof SeedGroup>;

/** Keyed by slug. Strapi doesn't enforce slug uniqueness, so the seed does. */
export const SeedCategory = z.strictObject({
  title: text,
  slug: Slug,
  description: text.optional(),
  mode: z.enum(CATEGORY_MODES).default('Ingredients'),
  group: text.optional(),
  ingredients: z.array(Slug).default([]),
  tips: z.array(text).default([]),
  seo: SeedSeo.optional(),
});
export type SeedCategory = z.infer<typeof SeedCategory>;

// Dynamic-zone blocks (Page.main). Images come later (OPEN-28).
export const SeedHeroBlock = z.strictObject({
  __component: z.literal('component.hero'),
  // layout: z.enum(HERO_LAYOUTS).default('Primary'),
  // eyebrow: text.optional(),
  //description: SeedRichText.default([]),
  description: text.optional(),
  // ctas: z.array(SeedCta).default([]),
  title: SeedRichText.default([]),
  backgroundColor: z.enum(BACKGROUND_COLOR).default('terra'),
});

export const SeedTeaserBlock = z.strictObject({
  __component: z.literal('component.teaser'),
  title: SeedTitle.optional(),
  //description: SeedRichText.default([]),
  description: text.optional(),
  ctas: z.array(SeedCta).default([]),
  // layout: z.enum(TEASER_LAYOUTS).default('Basic'),
});

export const SeedLinkListBlock = z.strictObject({
  __component: z.literal('component.link-list'),
  title: SeedTitle.optional(),
  //description: SeedRichText.default([]),
  description: text.optional(),
  pages: z.array(SeedPath).default([]),
  // layout: z.enum(LINK_LIST_LAYOUTS).default('Basic'),
});

export const SeedCarouselBlock = z.strictObject({
  __component: z.literal('component.carousel'),
  title: SeedTitle.optional(),
  description: text.optional(),
  categories: z.array(Slug).default([]),
  mode: z.enum(CAROUSEL_MODES).default('categories'),
  // layout: z.enum(CAROUSEL_LAYOUTS).default('Basic'),
  ctas: z.array(SeedCta).default([]),
});

export const SeedSearchBlock = z.strictObject({
  __component: z.literal('custom.search'),
  placeholder: text,
});

export const SeedTipListBlock = z.strictObject({
  __component: z.literal('custom.tip-list'),
  title: SeedTitle.optional(),
  description: text.optional(),
  tips: z.array(text).default([]),
  // layout: z.enum(TIP_LIST_LAYOUTS).default('Basic'),
});

export const SeedToolBlock = z.strictObject({
  __component: z.literal('custom.tool'),
  url_label: text,
  url_placeholder: text,
  upload_label: text,
  upload_placeholder: text,
  description: text,
  cta_label: text,
});

export const SeedBlock = z.discriminatedUnion('__component', [
  SeedHeroBlock,
  SeedTeaserBlock,
  SeedLinkListBlock,
  SeedCarouselBlock,
  SeedSearchBlock,
  SeedTipListBlock,
  SeedToolBlock,
]);
export type SeedBlock = z.infer<typeof SeedBlock>;
export const SEED_BLOCK_COMPONENTS = SeedBlock.options.map(
  (option) => option.shape.__component.value,
);

/** Which template each Page slot belongs to; mirrors the field conditions in the Strapi Page schema (TDD §6.4). */
// export const PAGE_SLOT_TEMPLATES = {
//   hero: ['home'],
//   intro: ['home'],
//   featured: ['home'],
//   tool: ['find-my-tips'],
//   main: ['generic', 'home'],
// } as const satisfies Record<string, readonly PageTemplate[]>;

/** Keyed by path (compared with `pathKey`). Template slots are only allowed on the template that shows them. */
export const SeedPage = z.strictObject({
  title: text,
  path: SeedPath,
  // template: z.enum(PAGE_TEMPLATES).default('generic'),
  seo: SeedSeo.optional(),
  // hero: SeedHeroBlock.omit({ __component: true }).optional(),
  // intro: SeedRichText.optional(),
  // featured: z.array(Slug).optional(),
  // tool: SeedToolBlock.omit({ __component: true }).optional(),
  main: z.array(SeedBlock).default([]),
});
// .superRefine((page, ctx) => {
//   for (const [slot, templates] of Object.entries(PAGE_SLOT_TEMPLATES)) {
//     const value = page[slot as keyof typeof PAGE_SLOT_TEMPLATES];
//     const empty = value === undefined || (Array.isArray(value) && value.length === 0);
//     if (!empty && !(templates as readonly PageTemplate[]).includes(page.template)) {
//       ctx.addIssue({
//         code: 'custom',
//         path: [slot],
//         message: `"${slot}" is not shown by the "${page.template}" template`,
//       });
//     }
//   }
// });
export type SeedPage = z.infer<typeof SeedPage>;

export const Seed = z.strictObject({
  taxonomies: SeedTaxonomies,
  ingredients: z.array(SeedIngredient),
  tips: z.array(SeedTip),
  groups: z.array(SeedGroup),
  categories: z.array(SeedCategory),
  pages: z.array(SeedPage),
});
export type Seed = z.infer<typeof Seed>;
export type SeedInput = z.input<typeof Seed>;

/** One fixture file per section, in write order: `fixtures/<section>.json` holding `{ version, data }`. */
export const SEED_SECTIONS = [
  'taxonomies',
  'ingredients',
  'tips',
  'groups',
  'categories',
  'pages',
] as const;
export type SeedSection = (typeof SEED_SECTIONS)[number];

export const seedFile = <T extends z.ZodType>(data: T) =>
  z.strictObject({ version: z.literal(SEED_VERSION), data });

export interface SeedIssue {
  path: string;
  message: string;
}

/** Cross-record checks Zod can't express: unique keys and resolvable references. Empty means valid. */
export function validateSeed(seed: Seed): SeedIssue[] {
  const issues: SeedIssue[] = [];
  const keys = <T>(
    section: string,
    items: readonly T[],
    key: (item: T) => string,
    label: string,
  ) => {
    const seen = new Set<string>();
    items.forEach((item, i) => {
      const value = key(item);
      if (!value) issues.push({ path: `${section}[${i}]`, message: `Empty ${label}` });
      else if (seen.has(value))
        issues.push({ path: `${section}[${i}]`, message: `Duplicate ${label} "${value}"` });
      else seen.add(value);
    });
    return seen;
  };
  const ref = (path: string, set: Set<string>, value: string | undefined, label: string) => {
    if (value !== undefined && !set.has(value))
      issues.push({ path, message: `Unknown ${label} "${value}"` });
  };
  // Home's key is '' after pathKey; keep it distinct from an empty key.
  const pageKey = (path: string) => pathKey(path) || '/';

  const tipTypes = keys('taxonomies.tip_types', seed.taxonomies.tip_types, (t) => t.title, 'title');
  const behaviors = keys(
    'taxonomies.tip_behaviors',
    seed.taxonomies.tip_behaviors,
    (t) => t.title,
    'title',
  );
  const motivators = keys(
    'taxonomies.tip_motivators',
    seed.taxonomies.tip_motivators,
    (t) => t.title,
    'title',
  );
  const ingredients = keys(
    'ingredients',
    seed.ingredients,
    (i) => toSlug(i.title),
    'ingredient slug',
  );
  const tips = keys('tips', seed.tips, (t) => t.title, 'title');
  const groups = keys('groups', seed.groups, (g) => g.title, 'title');
  const categories = keys('categories', seed.categories, (c) => c.slug, 'slug');
  const pages = keys('pages', seed.pages, (p) => pageKey(p.path), 'path');

  seed.tips.forEach((tip, i) => {
    ref(`tips[${i}].type`, tipTypes, tip.type, 'tip type');
    ref(`tips[${i}].behavior`, behaviors, tip.behavior, 'tip behavior');
    ref(`tips[${i}].motivator`, motivators, tip.motivator, 'tip motivator');
    ref(`tips[${i}].ingredient`, ingredients, tip.ingredient, 'ingredient');
  });
  seed.categories.forEach((category, i) => {
    ref(`categories[${i}].group`, groups, category.group, 'group');
    category.ingredients.forEach((slug, j) =>
      ref(`categories[${i}].ingredients[${j}]`, ingredients, slug, 'ingredient'),
    );
    category.tips.forEach((title, j) => ref(`categories[${i}].tips[${j}]`, tips, title, 'tip'));
  });
  seed.pages.forEach((page, i) => {
    page.main.forEach((block, j) => {
      const at = `pages[${i}].main[${j}]`;
      if ('ctas' in block) {
        block.ctas.forEach((cta, k) =>
          ref(
            `${at}.ctas[${k}].page`,
            pages,
            cta.page === undefined ? undefined : pageKey(cta.page),
            'page',
          ),
        );
      }
      if (block.__component === 'component.link-list') {
        block.pages.forEach((path, k) => ref(`${at}.pages[${k}]`, pages, pageKey(path), 'page'));
      }
      if (block.__component === 'component.carousel') {
        block.categories.forEach((slug, k) =>
          ref(`${at}.categories[${k}]`, categories, slug, 'category'),
        );
      }
      if (block.__component === 'custom.tip-list') {
        block.tips.forEach((title, k) => ref(`${at}.tips[${k}]`, tips, title, 'tip'));
      }
    });
  });
  return issues;
}

// For "ShortText" fields, it is generally recommended to include a `max` constraint, aligning with the 255-character limit used in Strapi.
export const SeedShortText = z.string().max(255).optional().nullable();
export type SeedShortText = z.infer<typeof SeedShortText>;

// LongText: Typically has no `max` limit and allows line breaks.
export const SeedLongText = z.string().optional().nullable();
export type SeedLongText = z.infer<typeof SeedLongText>;
