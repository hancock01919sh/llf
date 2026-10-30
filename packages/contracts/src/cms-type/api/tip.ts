import { z } from 'zod';
import { CategoryRef } from '../api/category';
import { IngredientRef } from '../api/ingredient';
import { TipBehaviorRef } from '../api/tip-behavior';
import { TipMotivatorRef } from '../api/tip-motivator';
import { TipTypeRef } from '../api/tip-type';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Tip = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  description: nullish(z.string()),
  ingredient: nullish(IngredientRef),
  tip_type: nullish(TipTypeRef),
  tip_behavior: nullish(TipBehaviorRef),
  tip_motivator: nullish(TipMotivatorRef),
  categories: nullish(CategoryRef.array()),
});

export const TipRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  description: nullish(z.string()),
});

export type Tip = z.infer<typeof Tip>;
