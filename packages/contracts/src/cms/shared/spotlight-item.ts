import { z } from 'zod';
import { MediaSchema } from '../media';

export const SpotlightItemSchema = z.object({
  Copy: z.string().optional(),
  Video: MediaSchema.optional(),
});

export type SpotlightItem = z.infer<typeof SpotlightItemSchema>;
