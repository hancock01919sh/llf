import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const EmojiItem = z.object({
  title: z.string(),
  emoji: nullish(z.string()),
  href: nullish(z.string()),
});

export const EmojiItemRef = z.object({
  title: z.string(),
  emoji: nullish(z.string()),
  href: nullish(z.string()),
});

export const EmojiItemDeepRef = z.object({
  title: z.string(),
  emoji: nullish(z.string()),
  href: nullish(z.string()),
});

export type EmojiItemDeepRef = z.infer<typeof EmojiItemDeepRef>;

export type EmojiItem = z.infer<typeof EmojiItem>;

export type EmojiItemRef = z.infer<typeof EmojiItemRef>;
