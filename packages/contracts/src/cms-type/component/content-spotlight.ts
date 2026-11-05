import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ContentSpotlight = z.object({
  __component: z.literal('component.content-spotlight'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Image: Media,
  Background_color: z.enum(['paper', 'sand']),
  Make_Image_left: nullish(z.boolean().default(false)),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const ContentSpotlightRef = z.object({
  __component: z.literal('component.content-spotlight'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Image: Media,
  Background_color: z.enum(['paper', 'sand']),
  Make_Image_left: nullish(z.boolean().default(false)),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const ContentSpotlightDeepRef = z.object({
  __component: z.literal('component.content-spotlight'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Image: Media,
  Background_color: z.enum(['paper', 'sand']),
  Make_Image_left: nullish(z.boolean().default(false)),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type ContentSpotlightDeepRef = z.infer<typeof ContentSpotlightDeepRef>;

export type ContentSpotlight = z.infer<typeof ContentSpotlight>;
