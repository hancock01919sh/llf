import { z } from 'zod';
import { MediaSchema } from '../media';

export const StandardCardSchema = z.object({
  Title: z.string().optional(),
  Image: MediaSchema.optional(),
});

export type StandardCard = z.infer<typeof StandardCardSchema>;
