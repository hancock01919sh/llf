import { z } from 'zod';
import { IngredientCardRef, IngredientCardDeepRef } from '../shared/ingredient-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const IngredientCarousel = z.object({
  __component: z.literal('component.ingredient-carousel'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  ingredientCard: z.array(z.lazy(() => IngredientCardRef)),
  backgroundColor: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(true)),
});

export const IngredientCarouselRef = z.object({
  __component: z.literal('component.ingredient-carousel'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  backgroundColor: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(true)),
});

export const IngredientCarouselDeepRef = z.object({
  __component: z.literal('component.ingredient-carousel'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  ingredientCard: z.array(z.lazy((): z.ZodType<IngredientCardDeepRef> => IngredientCardDeepRef)),
  backgroundColor: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(true)),
});

export type IngredientCarouselDeepRef = z.infer<typeof IngredientCarouselDeepRef>;

export type IngredientCarousel = z.infer<typeof IngredientCarousel>;

export type IngredientCarouselRef = z.infer<typeof IngredientCarouselRef>;
