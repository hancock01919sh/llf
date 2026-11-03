import { z } from 'zod';
import { CategoryRef } from '../api/category';
import { Media } from '../media';
import { TipRef } from '../api/tip';

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

export type Ingredient = z.infer<typeof Ingredient>;
