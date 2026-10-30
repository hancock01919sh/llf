import { z } from 'zod';
import { Links } from '../shared/links';
import { Media } from '../media';
import { ToolkitCategory } from '../api/toolkit-category';

export const AssetsCards = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image: Media.optional(),
  CTA: z.lazy((): z.ZodType => Links).optional(),
  File: Media.optional(),
  toolkit_category: z.lazy((): z.ZodType => ToolkitCategory).optional(),
  Display_Mode: z.enum(['Landscape', 'Portrait']).optional(),
});

export type AssetsCards = z.infer<typeof AssetsCards>;
