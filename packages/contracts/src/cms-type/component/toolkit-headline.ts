import { z } from 'zod';
import { Links } from '../shared/links';
import { Media } from '../media';

export const ToolkitHeadline = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  CTA: z.lazy((): z.ZodType => Links).optional(),
  File: Media.optional(),
});

export type ToolkitHeadline = z.infer<typeof ToolkitHeadline>;
