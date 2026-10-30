import { z } from 'zod';
import { Links } from '../shared/links';
import { Media } from '../media';

export const HighlightComponent = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image: Media.optional(),
  Background_color: z.enum(['forest-tint', 'paper', 'forest']).optional(),
  Link: z
    .lazy((): z.ZodType => Links)
    .array()
    .optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type HighlightComponent = z.infer<typeof HighlightComponent>;
