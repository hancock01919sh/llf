import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { SpotlightItemRef } from '../shared/spotlight-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolSpotlight = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Link: nullish(z.lazy(() => LinksRef)),
  SpotlightItem: nullish(z.array(z.lazy(() => SpotlightItemRef))),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['forest'])),
});

export const ToolSpotlightRef = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['forest'])),
});

export type ToolSpotlight = z.infer<typeof ToolSpotlight>;
