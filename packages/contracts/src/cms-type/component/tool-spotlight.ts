import { z } from 'zod';
import { Links } from '../shared/links';
import { SpotlightItem } from '../shared/spotlight-item';

export const ToolSpotlight = z.object({
  Title: z.string().optional(),
  SubTitle: z.string().optional(),
  Link: z.lazy((): z.ZodType => Links).optional(),
  SpotlightItem: z
    .lazy((): z.ZodType => SpotlightItem)
    .array()
    .optional(),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export type ToolSpotlight = z.infer<typeof ToolSpotlight>;
