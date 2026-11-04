import { z } from 'zod';
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

export type IngredientCard = z.infer<typeof IngredientCard>;
