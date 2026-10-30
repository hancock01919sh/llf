import { z } from 'zod';
import { EmojiItem } from '../shared/emoji-item';

export const CategoryEmoji = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Emoji: z
    .lazy((): z.ZodType => EmojiItem)
    .array()
    .optional(),
  Background_color: z.enum(['paper']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type CategoryEmoji = z.infer<typeof CategoryEmoji>;
