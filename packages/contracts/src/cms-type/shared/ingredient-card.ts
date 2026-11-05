import { z, ZodType } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const IngredientCard = z.object({
  Title: z.string(),
  Image: nullish(Media),
});

export const IngredientCardRef = z.object({
  Title: z.string(),
  Image: nullish(Media),
});

export const IngredientCardDeepRef = z.object({
  Title: z.string(),
  Image: nullish(Media),
});

export type IngredientCardDeepRef = z.infer<typeof IngredientCardDeepRef>;

export type IngredientCard = z.infer<typeof IngredientCard>;
