import { z } from 'zod';
import { MediaSchema } from '../media';
import {CategorySchema } from '../api/category';
import {TipSchema } from '../api/tip';

export const IngredientSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  type: z.enum(["Baked Goods","Dairy","Dry Foods","Fresh Herbs","Leafy Greens","Produce","Protein"]).optional(),
  synonyms: z.string().optional(),
  tips: z.lazy((): z.ZodType => TipSchema).array().optional(),
  wasted: z.number().int(),
  image: MediaSchema.optional(),
  categories: z.lazy((): z.ZodType => CategorySchema).array().optional(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;
