import { z } from 'zod';
import { MediaSchema } from '../media';

export const LogoCardsSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Image_Desktop: MediaSchema.array().optional(),
  Background_color: z.enum(['paper', 'forest']).optional(),
  Image_Mobile: MediaSchema.array().optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type LogoCards = z.infer<typeof LogoCardsSchema>;
