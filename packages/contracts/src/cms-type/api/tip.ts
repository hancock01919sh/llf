import { z } from 'zod';
import { CategoryRef, CategoryDeepRef } from '../api/category';
import { IngredientRef } from '../api/ingredient';
import { TipBehaviorRef, TipBehaviorDeepRef } from '../api/tip-behavior';
import { TipMotivatorRef, TipMotivatorDeepRef } from '../api/tip-motivator';
import { TipTypeRef, TipTypeDeepRef } from '../api/tip-type';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Tip = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  description: nullish(z.string()),
  ingredient: nullish(z.lazy(() => IngredientRef)),
  tip_type: nullish(z.lazy(() => TipTypeRef)),
  tip_behavior: nullish(z.lazy(() => TipBehaviorRef)),
  tip_motivator: nullish(z.lazy(() => TipMotivatorRef)),
  category: nullish(z.lazy(() => CategoryRef)),
});

export const TipRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  description: nullish(z.string()),
});

export const TipDeepRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  description: nullish(z.string()),
  ingredient: nullish(z.lazy((): z.ZodType<IngredientRef> => IngredientRef)),
  tip_type: nullish(z.lazy((): z.ZodType<TipTypeDeepRef> => TipTypeDeepRef)),
  tip_behavior: nullish(z.lazy((): z.ZodType<TipBehaviorDeepRef> => TipBehaviorDeepRef)),
  tip_motivator: nullish(z.lazy((): z.ZodType<TipMotivatorDeepRef> => TipMotivatorDeepRef)),
  category: nullish(z.lazy((): z.ZodType => CategoryDeepRef)),
});

export type TipDeepRef = z.infer<typeof TipDeepRef>;

export type Tip = z.infer<typeof Tip>;

export type TipRef = z.infer<typeof TipRef>;
