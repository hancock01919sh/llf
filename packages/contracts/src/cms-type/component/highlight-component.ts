import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const HighlightComponent = z.object({
  __component: z.literal('component.highlight-component'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Image: Media,
  Background_color: z.enum(['forest-tint', 'paper', 'forest']),
  Link: nullish(z.array(z.lazy(() => LinksRef))),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const HighlightComponentRef = z.object({
  __component: z.literal('component.highlight-component'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Image: Media,
  Background_color: z.enum(['forest-tint', 'paper', 'forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type HighlightComponent = z.infer<typeof HighlightComponent>;
