import type { ZodType } from 'zod';
import { z } from 'zod';
import { IngredientCardRef, IngredientCardDeepRef } from '../shared/ingredient-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const IngredientCarousel = z.object({
  __component: z.literal('component.ingredient-carousel'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  IngredientCard: z.array(z.lazy((): ZodType => IngredientCardRef)),
  Background_color: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(true)),
});

export const IngredientCarouselRef = z.object({
  __component: z.literal('component.ingredient-carousel'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Background_color: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(true)),
});

export const IngredientCarouselDeepRef = z.object({
  __component: z.literal('component.ingredient-carousel'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  IngredientCard: z.array(z.lazy((): ZodType => IngredientCardDeepRef)),
  Background_color: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(true)),
});

export type IngredientCarouselDeepRef = z.infer<typeof IngredientCarouselDeepRef>;

export type IngredientCarousel = z.infer<typeof IngredientCarousel>;
