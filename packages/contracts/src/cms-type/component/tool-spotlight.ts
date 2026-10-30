import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { SpotlightItemRef } from '../shared/spotlight-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolSpotlight = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Link: nullish(LinksRef),
  SpotlightItem: nullish(SpotlightItemRef.array()),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export const ToolSpotlightRef = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export type ToolSpotlight = z.infer<typeof ToolSpotlight>;
