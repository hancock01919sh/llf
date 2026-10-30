import { z } from 'zod';
import { MediaSchema } from '../media';
import {LinksSchema } from '../shared/links';

export const ToolkitHeadlineSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  CTA: z.lazy((): z.ZodType => LinksSchema).optional(),
  File: MediaSchema.optional(),
});

export type ToolkitHeadline = z.infer<typeof ToolkitHeadlineSchema>;
