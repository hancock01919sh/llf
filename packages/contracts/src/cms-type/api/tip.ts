import { z } from 'zod';
import { Category } from '../api/category';
import { Ingredient } from '../api/ingredient';
import { TipBehavior } from '../api/tip-behavior';
import { TipMotivator } from '../api/tip-motivator';
import { TipType } from '../api/tip-type';

export const Tip = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  ingredient: z.lazy((): z.ZodType => Ingredient).optional(),
  tip_type: z.lazy((): z.ZodType => TipType).optional(),
  tip_behavior: z.lazy((): z.ZodType => TipBehavior).optional(),
  tip_motivator: z.lazy((): z.ZodType => TipMotivator).optional(),
  categories: z
    .lazy((): z.ZodType => Category)
    .array()
    .optional(),
});

export type Tip = z.infer<typeof Tip>;
