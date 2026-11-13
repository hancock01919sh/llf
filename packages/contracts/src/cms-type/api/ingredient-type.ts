import { z } from 'zod';
import { IngredientRef, IngredientDeepRef } from '../api/ingredient';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const IngredientType = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  slug: z.string(),
  ingredients: nullish(z.array(z.lazy(() => IngredientRef))),
  emoji: z.string(),
});

export const IngredientTypeRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  slug: z.string(),
  emoji: z.string(),
});

export const IngredientTypeDeepRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  slug: z.string(),
  ingredients: nullish(z.array(z.lazy((): z.ZodType<IngredientDeepRef> => IngredientDeepRef))),
  emoji: z.string(),
});

export type IngredientTypeDeepRef = z.infer<typeof IngredientTypeDeepRef>;

export type IngredientType = z.infer<typeof IngredientType>;

export type IngredientTypeRef = z.infer<typeof IngredientTypeRef>;
