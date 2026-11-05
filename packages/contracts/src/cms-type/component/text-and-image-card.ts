import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TextAndImageCard = z.object({
  __component: z.literal('component.text-and-image-card'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  image: Media.array(),
  backgroundColor: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const TextAndImageCardRef = z.object({
  __component: z.literal('component.text-and-image-card'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  image: Media.array(),
  backgroundColor: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const TextAndImageCardDeepRef = z.object({
  __component: z.literal('component.text-and-image-card'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  image: Media.array(),
  backgroundColor: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type TextAndImageCardDeepRef = z.infer<typeof TextAndImageCardDeepRef>;

export type TextAndImageCard = z.infer<typeof TextAndImageCard>;

export type TextAndImageCardRef = z.infer<typeof TextAndImageCardRef>;
