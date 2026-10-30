import { z } from 'zod';
import {EmojiItemSchema } from '../shared/emoji-item';

export const CategoryEmojiSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Emoji: z.lazy((): z.ZodType => EmojiItemSchema).array().optional(),
  Background_color: z.enum(["paper"]).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type CategoryEmoji = z.infer<typeof CategoryEmojiSchema>;
