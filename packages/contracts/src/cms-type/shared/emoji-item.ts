import { z } from 'zod';

export const EmojiItem = z.object({
  Title: z.string().optional(),
  Emoji: z.string().optional(),
});

export type EmojiItem = z.infer<typeof EmojiItem>;
