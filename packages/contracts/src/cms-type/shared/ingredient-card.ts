import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const IngredientCard = z.object({
  title: z.string(),
  image: nullish(Media),
});

export const IngredientCardRef = z.object({
  title: z.string(),
  image: nullish(Media),
});

export const IngredientCardDeepRef = z.object({
  title: z.string(),
  image: nullish(Media),
});

export type IngredientCardDeepRef = z.infer<typeof IngredientCardDeepRef>;

export type IngredientCard = z.infer<typeof IngredientCard>;

export type IngredientCardRef = z.infer<typeof IngredientCardRef>;
