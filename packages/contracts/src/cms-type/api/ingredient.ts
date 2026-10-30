import { z } from 'zod';
import { Category } from '../api/category';
import { Media } from '../media';
import { Tip } from '../api/tip';

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
  synonyms: z.string().optional(),
  tips: z
    .lazy((): z.ZodType => Tip)
    .array()
    .optional(),
  wasted: z.number().int(),
  image: Media.optional(),
  categories: z
    .lazy((): z.ZodType => Category)
    .array()
    .optional(),
});

export type Ingredient = z.infer<typeof Ingredient>;
