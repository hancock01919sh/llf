import { z } from 'zod';
import { FeatureCardRef } from '../shared/feature-card';
import { LinksRef } from '../shared/links';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryCarouselFeature = z.object({
  __component: z.literal('component.category-carousel-feature'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  link: z.array(z.lazy(() => LinksRef)),
  featureCard: z.array(z.lazy(() => FeatureCardRef)),
  isFullwidth: nullish(z.boolean().default(true)),
  backgroundColor: z.enum(['terra']).default('terra'),
});

export const CategoryCarouselFeatureRef = z.object({
  __component: z.literal('component.category-carousel-feature'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  isFullwidth: nullish(z.boolean().default(true)),
  backgroundColor: z.enum(['terra']).default('terra'),
});

export const CategoryCarouselFeatureDeepRef = z.object({
  __component: z.literal('component.category-carousel-feature'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  isFullwidth: nullish(z.boolean().default(true)),
  backgroundColor: z.enum(['terra']).default('terra'),
});

export type CategoryCarouselFeatureDeepRef = z.infer<typeof CategoryCarouselFeatureDeepRef>;

export type CategoryCarouselFeature = z.infer<typeof CategoryCarouselFeature>;
