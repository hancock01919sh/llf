import { z } from 'zod';
import { Media } from '../media';

export const TextAndImageCard = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image: Media.array().optional(),
  Background_color: z.enum(['paper']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type TextAndImageCard = z.infer<typeof TextAndImageCard>;
