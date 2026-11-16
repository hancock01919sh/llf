import { z } from 'zod';
import { CategoryRef, CategoryDeepRef } from '../api/category';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const FeatureCard = z.object({
  category: nullish(z.lazy(() => CategoryRef)),
});

export const FeatureCardRef = z.object({});

export const FeatureCardDeepRef = z.object({
  category: nullish(z.lazy((): z.ZodType<CategoryDeepRef> => CategoryDeepRef)),
});

export type FeatureCardDeepRef = z.infer<typeof FeatureCardDeepRef>;

export type FeatureCard = z.infer<typeof FeatureCard>;

export type FeatureCardRef = z.infer<typeof FeatureCardRef>;
