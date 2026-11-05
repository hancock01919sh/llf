import { z } from 'zod';
import { EmojiItemRef, EmojiItemDeepRef } from '../shared/emoji-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryEmoji = z.object({
  __component: z.literal('component.category-emoji'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  emoji: z.array(z.lazy(() => EmojiItemRef)),
  backgroundColor: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const CategoryEmojiRef = z.object({
  __component: z.literal('component.category-emoji'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  backgroundColor: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const CategoryEmojiDeepRef = z.object({
  __component: z.literal('component.category-emoji'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  emoji: z.array(z.lazy((): z.ZodType<EmojiItemDeepRef> => EmojiItemDeepRef)),
  backgroundColor: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type CategoryEmojiDeepRef = z.infer<typeof CategoryEmojiDeepRef>;

export type CategoryEmoji = z.infer<typeof CategoryEmoji>;

export type CategoryEmojiRef = z.infer<typeof CategoryEmojiRef>;
