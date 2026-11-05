import type { ZodType } from 'zod';
import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const HighlightComponent = z.object({
  __component: z.literal('component.highlight-component'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  image: Media,
  backgroundColor: z.enum(['forest-tint', 'paper', 'forest']),
  link: nullish(z.array(z.lazy((): ZodType => LinksRef))),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const HighlightComponentRef = z.object({
  __component: z.literal('component.highlight-component'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  image: Media,
  backgroundColor: z.enum(['forest-tint', 'paper', 'forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const HighlightComponentDeepRef = z.object({
  __component: z.literal('component.highlight-component'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  image: Media,
  backgroundColor: z.enum(['forest-tint', 'paper', 'forest']),
  link: nullish(z.array(z.lazy((): ZodType => LinksDeepRef))),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type HighlightComponentDeepRef = z.infer<typeof HighlightComponentDeepRef>;

export type HighlightComponent = z.infer<typeof HighlightComponent>;
