import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolkitHeadline = z.object({
  __component: z.literal('component.toolkit-headline'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  CTA: nullish(z.lazy(() => LinksRef)),
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
  File: nullish(Media),
});

export type ToolkitHeadlineDeepRef = z.infer<typeof ToolkitHeadlineDeepRef>;

export type ToolkitHeadline = z.infer<typeof ToolkitHeadline>;
