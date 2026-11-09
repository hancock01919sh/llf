import { z } from 'zod';
import { CategoryRef, CategoryDeepRef } from '../api/category';
import { Media } from '../media';
import { TipRef, TipDeepRef } from '../api/tip';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Ingredient = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  type: nullish(
    z.enum([
      'Baked Goods',
      'Dairy',
      'Dry Foods',
      'Fresh Herbs',
      'Leafy Greens',
      'Produce',
      'Protein',
    ]),
  ),
  synonyms: nullish(z.string()),
  tips: nullish(z.array(z.lazy(() => TipRef))),
  wasted: z.number().int().default(3),
  image: nullish(Media),
  category: nullish(z.lazy(() => CategoryRef)),
});

export const IngredientRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  type: nullish(
    z.enum([
      'Baked Goods',
      'Dairy',
      'Dry Foods',
      'Fresh Herbs',
      'Leafy Greens',
      'Produce',
      'Protein',
    ]),
  ),
  synonyms: nullish(z.string()),
  wasted: z.number().int().default(3),
  image: nullish(Media),
});

export const IngredientDeepRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  type: nullish(
    z.enum([
      'Baked Goods',
      'Dairy',
      'Dry Foods',
      'Fresh Herbs',
      'Leafy Greens',
      'Produce',
      'Protein',
    ]),
  ),
  synonyms: nullish(z.string()),
  tips: nullish(z.array(z.lazy((): z.ZodType<TipDeepRef> => TipDeepRef))),
  wasted: z.number().int().default(3),
  image: nullish(Media),
  category: nullish(z.lazy((): z.ZodType => CategoryDeepRef)),
});

export type IngredientDeepRef = z.infer<typeof IngredientDeepRef>;

export type Ingredient = z.infer<typeof Ingredient>;

export type IngredientRef = z.infer<typeof IngredientRef>;
