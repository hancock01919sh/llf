import { z } from 'zod';
import { MediaSchema } from '../media';
import { LinksSchema } from '../shared/links';
import { ToolkitCategorySchema } from '../api/toolkit-category';

export const AssetsCardsSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image: MediaSchema.optional(),
  CTA: z.lazy((): z.ZodType => LinksSchema).optional(),
  File: MediaSchema.optional(),
  toolkit_category: z.lazy((): z.ZodType => ToolkitCategorySchema).optional(),
  Display_Mode: z.enum(['Landscape', 'Portrait']).optional(),
});

export type AssetsCards = z.infer<typeof AssetsCardsSchema>;
