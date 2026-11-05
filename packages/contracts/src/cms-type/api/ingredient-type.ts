import { z, ZodType } from 'zod';

export const IngredientType = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
});

export const IngredientTypeRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
});

export const IngredientTypeDeepRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
});

export type IngredientTypeDeepRef = z.infer<typeof IngredientTypeDeepRef>;

export type IngredientType = z.infer<typeof IngredientType>;
