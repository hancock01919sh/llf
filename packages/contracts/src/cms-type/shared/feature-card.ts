import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const FeatureCard = z.object({
  __component: z.literal('shared.feature-card'),
  id: z.number().int(),
  Title: z.string(),
  Image: nullish(Media),
});

export const FeatureCardRef = z.object({
  __component: z.literal('shared.feature-card'),
  id: z.number().int(),
  Title: z.string(),
  Image: nullish(Media),
});

export type FeatureCard = z.infer<typeof FeatureCard>;
