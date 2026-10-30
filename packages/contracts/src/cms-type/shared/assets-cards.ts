import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { Media } from '../media';
import { ToolkitCategoryRef } from '../api/toolkit-category';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const AssetsCards = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  CTA: nullish(LinksRef),
  File: nullish(Media),
  toolkit_category: nullish(ToolkitCategoryRef),
  Display_Mode: z.enum(['Landscape', 'Portrait']).optional(),
});

export const AssetsCardsRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  File: nullish(Media),
  Display_Mode: z.enum(['Landscape', 'Portrait']).optional(),
});

export type AssetsCards = z.infer<typeof AssetsCards>;
