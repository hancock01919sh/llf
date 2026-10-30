import { z } from 'zod';
import { IngredientCardRef } from '../shared/ingredient-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const IngredientCarousel = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  IngredientCard: nullish(IngredientCardRef.array()),
  Background_color: z.enum(['paper']).optional(),
  isFullwidth: z.boolean().default(true).optional(),
});

export const IngredientCarouselRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Background_color: z.enum(['paper']).optional(),
  isFullwidth: z.boolean().default(true).optional(),
});

export type IngredientCarousel = z.infer<typeof IngredientCarousel>;
