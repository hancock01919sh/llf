import { z } from 'zod';
import { CategoryRef, CategoryDeepRef } from '../api/category';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const EmojiItem = z.object({
  emoji: z.string(),
  category: nullish(z.lazy(() => CategoryRef)),
});

export const EmojiItemRef = z.object({
  emoji: z.string(),
});

export const EmojiItemDeepRef = z.object({
  emoji: z.string(),
  category: nullish(z.lazy((): z.ZodType<CategoryDeepRef> => CategoryDeepRef)),
});

export type EmojiItemDeepRef = z.infer<typeof EmojiItemDeepRef>;

export type EmojiItem = z.infer<typeof EmojiItem>;

export type EmojiItemRef = z.infer<typeof EmojiItemRef>;
