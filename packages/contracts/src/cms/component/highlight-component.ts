import { z } from 'zod';
import { MediaSchema } from '../media';
import { LinksSchema } from '../shared/links';

export const HighlightComponentSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image: MediaSchema.optional(),
  Background_color: z.enum(['forest-tint', 'paper', 'forest']).optional(),
  Link: z
    .lazy((): z.ZodType => LinksSchema)
    .array()
    .optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type HighlightComponent = z.infer<typeof HighlightComponentSchema>;
