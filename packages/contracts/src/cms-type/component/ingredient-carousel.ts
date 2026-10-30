import { z } from 'zod';
import { IngredientCard } from '../shared/ingredient-card';

export const IngredientCarousel = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  IngredientCard: z
    .lazy((): z.ZodType => IngredientCard)
    .array()
    .optional(),
  Background_color: z.enum(['paper']).optional(),
  isFullwidth: z.boolean().default(true).optional(),
});

export type IngredientCarousel = z.infer<typeof IngredientCarousel>;
