import { z } from 'zod';
import { MediaSchema } from '../media';

export const IngredientCardSchema = z.object({
  Title: z.string().optional(),
  Image: MediaSchema.optional(),
});

export type IngredientCard = z.infer<typeof IngredientCardSchema>;
