import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const HighlightComponent = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Background_color: nullish(z.enum(['forest-tint', 'paper', 'forest'])),
  Link: nullish(z.array(z.lazy(() => LinksRef))),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const HighlightComponentRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Background_color: nullish(z.enum(['forest-tint', 'paper', 'forest'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type HighlightComponent = z.infer<typeof HighlightComponent>;
