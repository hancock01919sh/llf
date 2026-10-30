import { z } from 'zod';

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

export type IngredientType = z.infer<typeof IngredientType>;
