import { z } from 'zod';
import { IngredientTypeRef, IngredientTypeDeepRef } from '../api/ingredient-type';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const EmojiItem = z.object({
  ingredient_type: nullish(z.lazy(() => IngredientTypeRef)),
});

export const EmojiItemRef = z.object({});

export const EmojiItemDeepRef = z.object({
  ingredient_type: nullish(z.lazy((): z.ZodType<IngredientTypeDeepRef> => IngredientTypeDeepRef)),
});

export type EmojiItemDeepRef = z.infer<typeof EmojiItemDeepRef>;

export type EmojiItem = z.infer<typeof EmojiItem>;

export type EmojiItemRef = z.infer<typeof EmojiItemRef>;
