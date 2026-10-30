import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const HighlightComponent = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: Media.optional(),
  Background_color: z.enum(['forest-tint', 'paper', 'forest']).optional(),
  Link: LinksRef.array().optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export const HighlightComponentRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: Media.optional(),
  Background_color: z.enum(['forest-tint', 'paper', 'forest']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type HighlightComponent = z.infer<typeof HighlightComponent>;
