import { z } from 'zod';

export const EmojiItemSchema = z.object({
  Title: z.string().optional(),
  Emoji: z.string().optional(),
});

export type EmojiItem = z.infer<typeof EmojiItemSchema>;
