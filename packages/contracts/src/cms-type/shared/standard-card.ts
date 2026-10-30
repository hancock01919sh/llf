import { z } from 'zod';
import { Media } from '../media';

export const StandardCard = z.object({
  Title: z.string().optional(),
  Image: Media.optional(),
});

export type StandardCard = z.infer<typeof StandardCard>;
