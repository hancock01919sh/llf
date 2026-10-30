import { z } from 'zod';
import { GroupRef } from '../api/group';
import { IngredientRef } from '../api/ingredient';
import { Media } from '../media';
import { SeoRef } from '../shared/seo';
import { TipRef } from '../api/tip';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Category = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  slug: z.string(),
  description: nullish(z.string()),
  ingredients: nullish(IngredientRef.array()),
  tips: nullish(TipRef.array()),
  mode: z.enum(['Ingredients', 'Tips']).default('Ingredients'),
  image: nullish(Media),
  group: nullish(GroupRef),
  seo: nullish(SeoRef),
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

export type Category = z.infer<typeof Category>;
