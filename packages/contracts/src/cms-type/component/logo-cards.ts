import { z } from 'zod';
import { Media } from '../media';

export const LogoCards = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image_Desktop: Media.array().optional(),
  Background_color: z.enum(['paper', 'forest']).optional(),
  Image_Mobile: Media.array().optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type LogoCards = z.infer<typeof LogoCards>;
