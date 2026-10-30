import { z } from 'zod';
import { CategoryRef } from '../api/category';
import { Media } from '../media';
import { TipRef } from '../api/tip';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Ingredient = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  type: z
    .enum([
      'Baked Goods',
      'Dairy',
      'Dry Foods',
      'Fresh Herbs',
      'Leafy Greens',
      'Produce',
      'Protein',
    ])
    .optional(),
  synonyms: nullish(z.string()),
  tips: nullish(TipRef.array()),
  wasted: z.number().int().default(3),
  image: Media.optional(),
  categories: nullish(CategoryRef.array()),
});

export const IngredientRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  type: z
    .enum([
      'Baked Goods',
      'Dairy',
      'Dry Foods',
      'Fresh Herbs',
      'Leafy Greens',
      'Produce',
      'Protein',
    ])
    .optional(),
  synonyms: nullish(z.string()),
  wasted: z.number().int().default(3),
  image: Media.optional(),
});

export type Ingredient = z.infer<typeof Ingredient>;
