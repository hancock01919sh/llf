import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { SpotlightItemRef } from '../shared/spotlight-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolSpotlight = z.object({
  __component: z.literal('component.tool-spotlight'),
  id: z.number().int(),
  Title: z.string(),
  SubTitle: z.string(),
  Link: nullish(z.lazy(() => LinksRef)),
  SpotlightItem: z.array(z.lazy(() => SpotlightItemRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: z.enum(['forest']),
});

export const ToolSpotlightRef = z.object({
  __component: z.literal('component.tool-spotlight'),
  id: z.number().int(),
  Title: z.string(),
  SubTitle: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: z.enum(['forest']),
});

export type ToolSpotlight = z.infer<typeof ToolSpotlight>;
