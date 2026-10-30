import { z } from 'zod';

export const IngredientTypeSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
});

export type IngredientType = z.infer<typeof IngredientTypeSchema>;
