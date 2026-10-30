import { z } from 'zod';
import { EmojiItemRef } from '../shared/emoji-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryEmoji = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Emoji: nullish(EmojiItemRef.array()),
  Background_color: z.enum(['paper']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export const CategoryEmojiRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Background_color: z.enum(['paper']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type CategoryEmoji = z.infer<typeof CategoryEmoji>;
