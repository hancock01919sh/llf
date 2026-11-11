import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { Media } from '../media';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const HighlightComponent = z.object({
  __component: z.literal('component.highlight-component'),
  id: z.number().int(),
  description: z.string(),
  desktopImage: Media,
  backgroundColor: z.enum(['forest-tint', 'paper', 'forest']),
  link: nullish(z.array(z.lazy(() => LinksRef))),
  isFullwidth: nullish(z.boolean().default(false)),
  title: z.lazy(() => TitleRef),
  mobileImage: nullish(Media),
});

export const HighlightComponentRef = z.object({
  __component: z.literal('component.highlight-component'),
  id: z.number().int(),
  description: z.string(),
  desktopImage: Media,
  backgroundColor: z.enum(['forest-tint', 'paper', 'forest']),
  isFullwidth: nullish(z.boolean().default(false)),
  mobileImage: nullish(Media),
});

export const HighlightComponentDeepRef = z.object({
  __component: z.literal('component.highlight-component'),
  id: z.number().int(),
  description: z.string(),
  desktopImage: Media,
  backgroundColor: z.enum(['forest-tint', 'paper', 'forest']),
  link: nullish(z.array(z.lazy((): z.ZodType<LinksDeepRef> => LinksDeepRef))),
  isFullwidth: nullish(z.boolean().default(false)),
  title: z.lazy((): z.ZodType<TitleDeepRef> => TitleDeepRef),
  mobileImage: nullish(Media),
});

export type HighlightComponentDeepRef = z.infer<typeof HighlightComponentDeepRef>;

export type HighlightComponent = z.infer<typeof HighlightComponent>;

export type HighlightComponentRef = z.infer<typeof HighlightComponentRef>;
