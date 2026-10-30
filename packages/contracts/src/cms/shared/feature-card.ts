import { z } from 'zod';
import { MediaSchema } from '../media';

export const FeatureCardSchema = z.object({
  Title: z.string().optional(),
  Image: MediaSchema.optional(),
});

export type FeatureCard = z.infer<typeof FeatureCardSchema>;
