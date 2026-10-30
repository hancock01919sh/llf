import { z } from 'zod';
import { MediaSchema } from '../media';

export const SmallCardSchema = z.object({
  Title: z.string().optional(),
  Image: MediaSchema.optional(),
});

export type SmallCard = z.infer<typeof SmallCardSchema>;
