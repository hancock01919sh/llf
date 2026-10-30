import { z } from 'zod';
import { MediaSchema } from '../media';

export const TextAndImageCardSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image: MediaSchema.array().optional(),
  Background_color: z.enum(['paper']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type TextAndImageCard = z.infer<typeof TextAndImageCardSchema>;
