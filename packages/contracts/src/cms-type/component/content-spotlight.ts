import { z } from 'zod';
import { Media } from '../media';

export const ContentSpotlight = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image: Media.optional(),
  Background_color: z.enum(['paper', 'sand']).optional(),
  Make_Image_left: z.boolean().default(false).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type ContentSpotlight = z.infer<typeof ContentSpotlight>;
