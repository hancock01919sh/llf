import { z } from 'zod';
import { CategorySchema } from '../api/category';
import { IngredientSchema } from '../api/ingredient';
import { TipBehaviorSchema } from '../api/tip-behavior';
import { TipMotivatorSchema } from '../api/tip-motivator';
import { TipTypeSchema } from '../api/tip-type';

export const TipSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  ingredient: z.lazy((): z.ZodType => IngredientSchema).optional(),
  tip_type: z.lazy((): z.ZodType => TipTypeSchema).optional(),
  tip_behavior: z.lazy((): z.ZodType => TipBehaviorSchema).optional(),
  tip_motivator: z.lazy((): z.ZodType => TipMotivatorSchema).optional(),
  categories: z
    .lazy((): z.ZodType => CategorySchema)
    .array()
    .optional(),
});

export type Tip = z.infer<typeof TipSchema>;
