import { z } from 'zod';
import { CategoryRef, CategoryDeepRef } from '../api/category';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const IngredientCard = z.object({
  category: nullish(z.lazy(() => CategoryRef)),
});

export const IngredientCardRef = z.object({});

export const IngredientCardDeepRef = z.object({
  category: nullish(z.lazy((): z.ZodType<CategoryDeepRef> => CategoryDeepRef)),
});

export type IngredientCardDeepRef = z.infer<typeof IngredientCardDeepRef>;

export type IngredientCard = z.infer<typeof IngredientCard>;

export type IngredientCardRef = z.infer<typeof IngredientCardRef>;
