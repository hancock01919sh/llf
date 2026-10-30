import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolkitHeadline = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  CTA: LinksRef.optional(),
  File: Media.optional(),
});

export const ToolkitHeadlineRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  File: Media.optional(),
});

export type ToolkitHeadline = z.infer<typeof ToolkitHeadline>;
