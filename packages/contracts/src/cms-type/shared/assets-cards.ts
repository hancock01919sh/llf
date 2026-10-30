import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { Media } from '../media';
import { ToolkitCategoryRef } from '../api/toolkit-category';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const AssetsCards = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  CTA: nullish(z.lazy(() => LinksRef)),
  File: nullish(Media),
  toolkit_category: nullish(z.lazy(() => ToolkitCategoryRef)),
  Display_Mode: nullish(z.enum(['Landscape', 'Portrait'])),
});

export const AssetsCardsRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  File: nullish(Media),
  Display_Mode: nullish(z.enum(['Landscape', 'Portrait'])),
});

export type AssetsCards = z.infer<typeof AssetsCards>;
