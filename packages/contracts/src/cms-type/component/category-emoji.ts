import { z } from 'zod';
import { EmojiItemRef } from '../shared/emoji-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryEmoji = z.object({
  __component: z.literal('component.category-emoji'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Emoji: z.array(z.lazy(() => EmojiItemRef)),
  Background_color: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const CategoryEmojiRef = z.object({
  __component: z.literal('component.category-emoji'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Background_color: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type CategoryEmoji = z.infer<typeof CategoryEmoji>;
