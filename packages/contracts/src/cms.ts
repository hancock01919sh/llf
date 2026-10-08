import { z } from 'zod';

/**
 * Zod schemas for Strapi 5 REST responses, matching `apps/cms/src` as imported (TDD §5.1).
 * Optional fields come back as `null`; unpopulated relations are absent. Unknown keys are stripped,
 * so additive schema changes (TDD §5.2) don't break older web builds.
 */

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Entry = z.object({
  id: z.number().int(),
  documentId: z.string().min(1),
});

export const Media = Entry.extend({
  url: z.string().min(1),
  alternativeText: nullish(z.string()),
  caption: nullish(z.string()),
  width: nullish(z.number()),
  height: nullish(z.number()),
  mime: nullish(z.string()),
  name: nullish(z.string()),
});
export type Media = z.infer<typeof Media>;

/** Strapi `blocks` rich text. Rendered by `@strapi/blocks-react-renderer`; kept loose here. */
export const BlocksContent = z.array(z.looseObject({ type: z.string() }));
export type BlocksContent = z.infer<typeof BlocksContent>;

export const HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
export const HeadingLevel = z.enum(HEADING_LEVELS);
export type HeadingLevel = z.infer<typeof HeadingLevel>;

// Shared components
export const Title = z.object({
  copy: nullish(z.string()),
  header: HeadingLevel.default('h3'),
});
export type Title = z.infer<typeof Title>;

export const PageRef = Entry.extend({
  title: z.string(),
  path: z.string(),
});
export type PageRef = z.infer<typeof PageRef>;

export const Cta = z.object({
  id: z.number().int().optional(),
  label: nullish(z.string()),
  href: nullish(z.string()),
  page: nullish(PageRef),
});
export type Cta = z.infer<typeof Cta>;

export const Seo = z.object({
  metaTitle: nullish(z.string()),
  /** Deprecated (TDD §5.2); kept so data isn't lost. */
  metaKeywords: nullish(z.string()),
  metaDescription: nullish(z.string()),
});
export type Seo = z.infer<typeof Seo>;

// Taxonomies
export const Taxonomy = Entry.extend({ title: z.string() });
export type Taxonomy = z.infer<typeof Taxonomy>;

/** Enum values from `apps/cms/src`, exported so the seed and web share one list. */
export const INGREDIENT_TYPES = [
  'Baked Goods',
  'Dairy',
  'Dry Foods',
  'Fresh Herbs',
  'Leafy Greens',
  'Produce',
  'Protein',
] as const;
export const CATEGORY_MODES = ['Ingredients', 'Tips'] as const;
export const HERO_LAYOUTS = ['Primary', 'Secondary'] as const;
export const TEASER_LAYOUTS = ['Basic', 'Highlight', 'Quote'] as const;
export const LINK_LIST_LAYOUTS = ['Basic', 'Two Column'] as const;
export const CAROUSEL_MODES = ['categories'] as const;
export const CAROUSEL_LAYOUTS = ['Basic', 'Compact'] as const;
export const TIP_LIST_LAYOUTS = ['Basic', 'Single'] as const;

// Collections
export const IngredientRef = Entry.extend({
  title: z.string(),
});

export const Tip = Entry.extend({
  title: z.string(),
  description: nullish(z.string()),
  tip_type: nullish(Taxonomy),
  tip_behavior: nullish(Taxonomy),
  tip_motivator: nullish(Taxonomy),
  ingredient: nullish(IngredientRef),
});
export type Tip = z.infer<typeof Tip>;

export const Ingredient = Entry.extend({
  title: z.string(),
  type: nullish(z.enum(INGREDIENT_TYPES)),
  /** One comma-separated string today; becomes a repeatable component (TDD §5.2). */
  synonyms: nullish(z.string()),
  wasted: z.number().int().min(1).max(5).default(3),
  image: nullish(Media),
  tips: z.array(Tip).optional(),
});
export type Ingredient = z.infer<typeof Ingredient>;

export const CategoryRef = Entry.extend({
  title: z.string(),
  slug: z.string(),
});

export const Category = CategoryRef.extend({
  description: nullish(z.string()),
  mode: z.enum(CATEGORY_MODES).default('Ingredients'),
  image: nullish(Media),
  ingredients: z.array(Ingredient).optional(),
  tips: z.array(Tip).optional(),
  group: nullish(Entry.extend({ title: z.string() })),
  seo: nullish(Seo),
});
export type Category = z.infer<typeof Category>;

export const Group = Entry.extend({
  title: z.string(),
  description: z.string(),
  categories: z.array(Category).optional(),
});
export type Group = z.infer<typeof Group>;

// Dynamic-zone blocks (Page.main)
const block = <const C extends string>(component: C) =>
  z.object({ __component: z.literal(component), id: z.number().int() });

export const HeroBlock = block('component.hero').extend({
  description: nullish(BlocksContent),
  ctas: z.array(Cta).default([]),
  images: nullish(z.array(Media)),
  eyebrow: nullish(z.string()),
  layout: z.enum(HERO_LAYOUTS).default('Primary'),
});
export type HeroBlock = z.infer<typeof HeroBlock>;

export const TeaserBlock = block('component.teaser').extend({
  title: nullish(Title),
  description: nullish(BlocksContent),
  ctas: z.array(Cta).default([]),
  images: nullish(z.array(Media)),
  layout: z.enum(TEASER_LAYOUTS).default('Basic'),
});
export type TeaserBlock = z.infer<typeof TeaserBlock>;

export const LinkListBlock = block('component.link-list').extend({
  title: nullish(Title),
  description: nullish(BlocksContent),
  pages: z.array(PageRef).default([]),
  layout: z.enum(LINK_LIST_LAYOUTS).default('Basic'),
});
export type LinkListBlock = z.infer<typeof LinkListBlock>;

export const CarouselBlock = block('component.carousel').extend({
  title: nullish(Title),
  description: nullish(z.string()),
  categories: z.array(CategoryRef.extend({ image: nullish(Media) })).default([]),
  mode: z.enum(CAROUSEL_MODES).default('categories'),
  layout: z.enum(CAROUSEL_LAYOUTS).default('Basic'),
  ctas: z.array(Cta).default([]),
});
export type CarouselBlock = z.infer<typeof CarouselBlock>;

export const SearchBlock = block('custom.search').extend({
  placeholder: z.string(),
});
export type SearchBlock = z.infer<typeof SearchBlock>;

export const TipListBlock = block('custom.tip-list').extend({
  title: nullish(Title),
  description: nullish(z.string()),
  tips: z.array(Tip).default([]),
  layout: z.enum(TIP_LIST_LAYOUTS).default('Basic'),
});
export type TipListBlock = z.infer<typeof TipListBlock>;

export const ToolBlock = block('custom.tool').extend({
  url_label: z.string(),
  url_placeholder: z.string(),
  upload_label: z.string(),
  upload_placeholder: z.string(),
  description: z.string(),
  cta_label: z.string(),
});
export type ToolBlock = z.infer<typeof ToolBlock>;

/** Envelope only. Each block is validated by the web block registry, which owns unknown-block handling. */
export const UnknownBlock = z.looseObject({
  __component: z.string(),
  id: z.number().int(),
});
export type UnknownBlock = z.infer<typeof UnknownBlock>;

/** Fixed layouts a Page can select (TDD D21). Only `generic` and `home` render `main`. */
export const PAGE_TEMPLATES = ['generic', 'home', 'find-my-tips', 'library'] as const;
export type PageTemplate = (typeof PAGE_TEMPLATES)[number];

/** Single (non-dynamic-zone) components come back without `__component`. */
export const HeroSlot = HeroBlock.omit({ __component: true });
export type HeroSlot = z.infer<typeof HeroSlot>;
export const ToolSlot = ToolBlock.omit({ __component: true });
export type ToolSlot = z.infer<typeof ToolSlot>;
export const FeaturedCategory = CategoryRef.extend({ image: nullish(Media) });
export type FeaturedCategory = z.infer<typeof FeaturedCategory>;

export const Page = Entry.extend({
  title: z.string(),
  path: z.string(),
  // Rows created before the field existed come back null.
  template: z
    .enum(PAGE_TEMPLATES)
    .nullish()
    .transform((v) => v ?? 'generic'),
  hero: nullish(HeroSlot),
  intro: nullish(BlocksContent),
  featured: z.array(FeaturedCategory).default([]),
  tool: nullish(ToolSlot),
  main: z.array(UnknownBlock).default([]),
  seo: nullish(Seo),
});
export type Page = z.infer<typeof Page>;

/** Strapi 5 REST envelopes. */
export const collectionResponse = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    meta: z
      .object({
        pagination: z
          .object({
            page: z.number(),
            pageSize: z.number(),
            pageCount: z.number(),
            total: z.number(),
          })
          .optional(),
      })
      .optional(),
  });

export const singleResponse = <T extends z.ZodType>(item: T) => z.object({ data: item });
