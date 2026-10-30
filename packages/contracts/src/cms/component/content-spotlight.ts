import { z } from 'zod';
import { MediaSchema } from '../media';

export const ContentSpotlightSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image: MediaSchema.optional(),
  Background_color: z.enum(['paper', 'sand']).optional(),
  Make_Image_left: z.boolean().default(false).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type ContentSpotlight = z.infer<typeof ContentSpotlightSchema>;
