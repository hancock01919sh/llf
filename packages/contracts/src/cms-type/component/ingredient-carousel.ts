import { z } from 'zod';
import { IngredientCardRef } from '../shared/ingredient-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const IngredientCarousel = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  IngredientCard: nullish(z.array(z.lazy(() => IngredientCardRef))),
  Background_color: nullish(z.enum(['paper'])),
  isFullwidth: nullish(z.boolean().default(true)),
});

export const IngredientCarouselRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Background_color: nullish(z.enum(['paper'])),
  isFullwidth: nullish(z.boolean().default(true)),
});

export type IngredientCarousel = z.infer<typeof IngredientCarousel>;
