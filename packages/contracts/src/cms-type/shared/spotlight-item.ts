import { z } from 'zod';
import { Media } from '../media';

export const SpotlightItem = z.object({
  Copy: z.string().optional(),
  Video: Media.optional(),
});

export type SpotlightItem = z.infer<typeof SpotlightItem>;
