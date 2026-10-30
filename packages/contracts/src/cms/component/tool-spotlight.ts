import { z } from 'zod';
import { LinksSchema } from '../shared/links';
import { SpotlightItemSchema } from '../shared/spotlight-item';

export const ToolSpotlightSchema = z.object({
  Title: z.string().optional(),
  SubTitle: z.string().optional(),
  Link: z.lazy((): z.ZodType => LinksSchema).optional(),
  SpotlightItem: z
    .lazy((): z.ZodType => SpotlightItemSchema)
    .array()
    .optional(),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export type ToolSpotlight = z.infer<typeof ToolSpotlightSchema>;
