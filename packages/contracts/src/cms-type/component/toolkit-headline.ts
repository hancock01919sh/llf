import type { ZodType } from 'zod';
import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolkitHeadline = z.object({
  __component: z.literal('component.toolkit-headline'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  CTA: nullish(z.lazy((): ZodType => LinksRef)),
  File: nullish(Media),
});

export const ToolkitHeadlineRef = z.object({
  __component: z.literal('component.toolkit-headline'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  File: nullish(Media),
});

export const ToolkitHeadlineDeepRef = z.object({
  __component: z.literal('component.toolkit-headline'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  CTA: nullish(z.lazy((): ZodType => LinksDeepRef)),
  File: nullish(Media),
});

export type ToolkitHeadlineDeepRef = z.infer<typeof ToolkitHeadlineDeepRef>;

export type ToolkitHeadline = z.infer<typeof ToolkitHeadline>;
