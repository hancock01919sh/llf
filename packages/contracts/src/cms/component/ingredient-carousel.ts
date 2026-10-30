import { z } from 'zod';
import { IngredientCardSchema } from '../shared/ingredient-card';

export const IngredientCarouselSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  IngredientCard: z
    .lazy((): z.ZodType => IngredientCardSchema)
    .array()
    .optional(),
  Background_color: z.enum(['paper']).optional(),
  isFullwidth: z.boolean().default(true).optional(),
});

export type IngredientCarousel = z.infer<typeof IngredientCarouselSchema>;
