import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const EmojiItem = z.object({
  Title: nullish(z.string()),
  Emoji: nullish(z.string()),
});

export const EmojiItemRef = z.object({
  Title: nullish(z.string()),
  Emoji: nullish(z.string()),
});

export type EmojiItem = z.infer<typeof EmojiItem>;
