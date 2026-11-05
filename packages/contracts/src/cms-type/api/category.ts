import { z } from 'zod';
import { GroupRef, GroupDeepRef } from '../api/group';
import { IngredientRef, IngredientDeepRef } from '../api/ingredient';
import { Media } from '../media';
import { SeoRef, SeoDeepRef } from '../shared/seo';
import { TipRef, TipDeepRef } from '../api/tip';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Category = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  slug: z.string(),
  description: nullish(z.string()),
  ingredients: nullish(z.array(z.lazy(() => IngredientRef))),
  tips: nullish(z.array(z.lazy(() => TipRef))),
  mode: z.enum(['Ingredients', 'Tips']).default('Ingredients'),
  image: nullish(Media),
  group: nullish(z.lazy(() => GroupRef)),
  seo: nullish(z.lazy(() => SeoRef)),
});

export const CategoryRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  slug: z.string(),
  description: nullish(z.string()),
  mode: z.enum(['Ingredients', 'Tips']).default('Ingredients'),
  image: nullish(Media),
});

export const CategoryDeepRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  slug: z.string(),
  description: nullish(z.string()),
  ingredients: nullish(z.array(z.lazy((): z.ZodType<IngredientDeepRef> => IngredientDeepRef))),
  tips: nullish(z.array(z.lazy((): z.ZodType => TipDeepRef))),
  mode: z.enum(['Ingredients', 'Tips']).default('Ingredients'),
  image: nullish(Media),
  group: nullish(z.lazy((): z.ZodType<GroupDeepRef> => GroupDeepRef)),
  seo: nullish(z.lazy((): z.ZodType<SeoDeepRef> => SeoDeepRef)),
});

export type CategoryDeepRef = z.infer<typeof CategoryDeepRef>;

export type Category = z.infer<typeof Category>;
