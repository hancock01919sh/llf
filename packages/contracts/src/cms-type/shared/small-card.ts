import { z } from 'zod';
import { Media } from '../media';

export const SmallCard = z.object({
  Title: z.string().optional(),
  Image: Media.optional(),
});

export type SmallCard = z.infer<typeof SmallCard>;
