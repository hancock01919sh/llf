import { z, ZodType } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const FeatureCard = z.object({
  title: z.string(),
  image: nullish(Media),
});

export const FeatureCardRef = z.object({
  title: z.string(),
  image: nullish(Media),
});

export const FeatureCardDeepRef = z.object({
  title: z.string(),
  image: nullish(Media),
});

export type FeatureCardDeepRef = z.infer<typeof FeatureCardDeepRef>;

export type FeatureCard = z.infer<typeof FeatureCard>;
