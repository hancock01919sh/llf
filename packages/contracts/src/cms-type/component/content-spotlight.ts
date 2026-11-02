import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ContentSpotlight = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Background_color: nullish(z.enum(['paper', 'sand'])),
  Make_Image_left: nullish(z.boolean().default(false)),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const ContentSpotlightRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  Background_color: nullish(z.enum(['paper', 'sand'])),
  Make_Image_left: nullish(z.boolean().default(false)),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type ContentSpotlight = z.infer<typeof ContentSpotlight>;
