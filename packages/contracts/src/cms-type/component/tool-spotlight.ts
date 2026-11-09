import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { SpotlightItemRef, SpotlightItemDeepRef } from '../shared/spotlight-item';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolSpotlight = z.object({
  __component: z.literal('component.tool-spotlight'),
  id: z.number().int(),
  subTitle: z.string(),
  link: nullish(z.lazy(() => LinksRef)),
  spotlightItem: z.array(z.lazy(() => SpotlightItemRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
  title: z.lazy(() => TitleRef),
});

export const ToolSpotlightRef = z.object({
  __component: z.literal('component.tool-spotlight'),
  id: z.number().int(),
  subTitle: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
});

export const ToolSpotlightDeepRef = z.object({
  __component: z.literal('component.tool-spotlight'),
  id: z.number().int(),
  subTitle: z.string(),
  link: nullish(z.lazy((): z.ZodType<LinksDeepRef> => LinksDeepRef)),
  spotlightItem: z.array(z.lazy((): z.ZodType<SpotlightItemDeepRef> => SpotlightItemDeepRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
  title: z.lazy((): z.ZodType<TitleDeepRef> => TitleDeepRef),
});

export type ToolSpotlightDeepRef = z.infer<typeof ToolSpotlightDeepRef>;

export type ToolSpotlight = z.infer<typeof ToolSpotlight>;

export type ToolSpotlightRef = z.infer<typeof ToolSpotlightRef>;
