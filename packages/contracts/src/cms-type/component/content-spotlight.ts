import { z } from 'zod';
import { Media } from '../media';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ContentSpotlight = z.object({
  __component: z.literal('component.content-spotlight'),
  id: z.number().int(),
  description: z.string(),
  image: Media,
  backgroundColor: z.enum(['paper', 'sand']),
  makeImageLeft: nullish(z.boolean().default(false)),
  isFullwidth: nullish(z.boolean().default(false)),
  title: z.lazy(() => TitleRef),
});

export const ContentSpotlightRef = z.object({
  __component: z.literal('component.content-spotlight'),
  id: z.number().int(),
  description: z.string(),
  image: Media,
  backgroundColor: z.enum(['paper', 'sand']),
  makeImageLeft: nullish(z.boolean().default(false)),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const ContentSpotlightDeepRef = z.object({
  __component: z.literal('component.content-spotlight'),
  id: z.number().int(),
  description: z.string(),
  image: Media,
  backgroundColor: z.enum(['paper', 'sand']),
  makeImageLeft: nullish(z.boolean().default(false)),
  isFullwidth: nullish(z.boolean().default(false)),
  title: z.lazy((): z.ZodType<TitleDeepRef> => TitleDeepRef),
});

export type ContentSpotlightDeepRef = z.infer<typeof ContentSpotlightDeepRef>;

export type ContentSpotlight = z.infer<typeof ContentSpotlight>;

export type ContentSpotlightRef = z.infer<typeof ContentSpotlightRef>;
