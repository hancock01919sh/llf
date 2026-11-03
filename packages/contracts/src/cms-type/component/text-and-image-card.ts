import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TextAndImageCard = z.object({
  __component: z.literal('component.text-and-image-card'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Image: Media.array(),
  Background_color: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const TextAndImageCardRef = z.object({
  __component: z.literal('component.text-and-image-card'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Image: Media.array(),
  Background_color: z.enum(['paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type TextAndImageCard = z.infer<typeof TextAndImageCard>;
