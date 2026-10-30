import { z } from 'zod';
import { Media } from '../media';

export const IngredientCard = z.object({
  Title: z.string().optional(),
  Image: Media.optional(),
});

export type IngredientCard = z.infer<typeof IngredientCard>;
