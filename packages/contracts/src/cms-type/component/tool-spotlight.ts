import type { ZodType } from 'zod';
import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { SpotlightItemRef, SpotlightItemDeepRef } from '../shared/spotlight-item';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolSpotlight = z.object({
  __component: z.literal('component.tool-spotlight'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  link: nullish(z.lazy((): ZodType => LinksRef)),
  spotlightItem: z.array(z.lazy((): ZodType => SpotlightItemRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
});

export const ToolSpotlightRef = z.object({
  __component: z.literal('component.tool-spotlight'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
});

export const ToolSpotlightDeepRef = z.object({
  __component: z.literal('component.tool-spotlight'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  link: nullish(z.lazy((): ZodType => LinksDeepRef)),
  spotlightItem: z.array(z.lazy((): ZodType => SpotlightItemDeepRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
});

export type ToolSpotlightDeepRef = z.infer<typeof ToolSpotlightDeepRef>;

export type ToolSpotlight = z.infer<typeof ToolSpotlight>;
