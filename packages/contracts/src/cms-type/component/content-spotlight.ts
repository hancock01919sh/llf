import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ContentSpotlight = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Background_color: z.enum(['paper', 'sand']).optional(),
  Make_Image_left: z.boolean().default(false).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export const ContentSpotlightRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Background_color: z.enum(['paper', 'sand']).optional(),
  Make_Image_left: z.boolean().default(false).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type ContentSpotlight = z.infer<typeof ContentSpotlight>;
