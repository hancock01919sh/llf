import type { ZodType } from 'zod';
import { z } from 'zod';
import { CategoryRef, CategoryDeepRef } from '../api/category';
import { IngredientRef, IngredientDeepRef } from '../api/ingredient';
import { TipBehaviorRef, TipBehaviorDeepRef } from '../api/tip-behavior';
import { TipMotivatorRef, TipMotivatorDeepRef } from '../api/tip-motivator';
import { TipTypeRef, TipTypeDeepRef } from '../api/tip-type';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Tip = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  description: nullish(z.string()),
  ingredient: nullish(z.lazy((): ZodType => IngredientRef)),
  tip_type: nullish(z.lazy((): ZodType => TipTypeRef)),
  tip_behavior: nullish(z.lazy((): ZodType => TipBehaviorRef)),
  tip_motivator: nullish(z.lazy((): ZodType => TipMotivatorRef)),
  category: nullish(z.lazy((): ZodType => CategoryRef)),
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
  ingredient: nullish(z.lazy((): ZodType => IngredientDeepRef)),
  tip_type: nullish(z.lazy((): ZodType => TipTypeDeepRef)),
  tip_behavior: nullish(z.lazy((): ZodType => TipBehaviorDeepRef)),
  tip_motivator: nullish(z.lazy((): ZodType => TipMotivatorDeepRef)),
  category: nullish(z.lazy((): ZodType => CategoryDeepRef)),
});

export type TipDeepRef = z.infer<typeof TipDeepRef>;

export type Tip = z.infer<typeof Tip>;
