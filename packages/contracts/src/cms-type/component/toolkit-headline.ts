import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { Media } from '../media';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolkitHeadline = z.object({
  __component: z.literal('component.toolkit-headline'),
  id: z.number().int(),
  description: z.string(),
  cta: nullish(z.lazy(() => LinksRef)),
  file: nullish(Media),
  title: nullish(z.lazy(() => TitleRef)),
});

export const ToolkitHeadlineRef = z.object({
  __component: z.literal('component.toolkit-headline'),
  id: z.number().int(),
  description: z.string(),
  file: nullish(Media),
});

export const ToolkitHeadlineDeepRef = z.object({
  __component: z.literal('component.toolkit-headline'),
  id: z.number().int(),
  description: z.string(),
  cta: nullish(z.lazy((): z.ZodType<LinksDeepRef>  => LinksDeepRef)),
  file: nullish(Media),
  title: nullish(z.lazy((): z.ZodType<TitleDeepRef>  => TitleDeepRef)),
});

export type ToolkitHeadlineDeepRef = z.infer<typeof ToolkitHeadlineDeepRef>;

export type ToolkitHeadline = z.infer<typeof ToolkitHeadline>;

export type ToolkitHeadlineRef = z.infer<typeof ToolkitHeadlineRef>;
