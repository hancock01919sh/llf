import { z } from 'zod';
import { Media } from '../media';

export const FeatureCard = z.object({
  Title: z.string().optional(),
  Image: Media.optional(),
});

export type FeatureCard = z.infer<typeof FeatureCard>;
