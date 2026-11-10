import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const FeatureCard = z.object({
  title: z.string(),
  image: nullish(Media),
  href: nullish(z.string()),
});

export const FeatureCardRef = z.object({
  title: z.string(),
  image: nullish(Media),
  href: nullish(z.string()),
});

export const FeatureCardDeepRef = z.object({
  title: z.string(),
  image: nullish(Media),
  href: nullish(z.string()),
});

export type FeatureCardDeepRef = z.infer<typeof FeatureCardDeepRef>;

export type FeatureCard = z.infer<typeof FeatureCard>;

export type FeatureCardRef = z.infer<typeof FeatureCardRef>;
