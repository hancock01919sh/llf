import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { Media } from '../media';
import { ToolkitCategoryRef } from '../api/toolkit-category';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const AssetsCards = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: Media.optional(),
  CTA: LinksRef.optional(),
  File: Media.optional(),
  toolkit_category: nullish(ToolkitCategoryRef),
  Display_Mode: z.enum(['Landscape', 'Portrait']).optional(),
});

export const AssetsCardsRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: Media.optional(),
  File: Media.optional(),
  Display_Mode: z.enum(['Landscape', 'Portrait']).optional(),
});

export type AssetsCards = z.infer<typeof AssetsCards>;
