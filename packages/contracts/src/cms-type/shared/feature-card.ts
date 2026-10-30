import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const FeatureCard = z.object({
  Title: nullish(z.string()),
  Image: Media.optional(),
});

export const FeatureCardRef = z.object({
  Title: nullish(z.string()),
  Image: Media.optional(),
});

export type FeatureCard = z.infer<typeof FeatureCard>;
