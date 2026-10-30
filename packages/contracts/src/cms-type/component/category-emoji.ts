import { z } from 'zod';
import { EmojiItemRef } from '../shared/emoji-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryEmoji = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Emoji: nullish(z.array(z.lazy(() => EmojiItemRef))),
  Background_color: nullish(z.enum(['paper'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const CategoryEmojiRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Background_color: nullish(z.enum(['paper'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type CategoryEmoji = z.infer<typeof CategoryEmoji>;
