import { z } from 'zod';
import { FeatureCardRef, FeatureCardDeepRef } from '../shared/feature-card';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryCarouselFeature = z.object({
  __component: z.literal('component.category-carousel-feature'),
  id: z.number().int(),
  description: z.string(),
  link: z.array(z.lazy(() => LinksRef)),
  featureCard: z.array(z.lazy(() => FeatureCardRef)),
  isFullwidth: nullish(z.boolean().default(true)),
  backgroundColor: z.enum(['terra']).default('terra'),
  title: z.lazy(() => TitleRef),
});

export const CategoryCarouselFeatureRef = z.object({
  __component: z.literal('component.category-carousel-feature'),
  id: z.number().int(),
  description: z.string(),
  isFullwidth: nullish(z.boolean().default(true)),
  backgroundColor: z.enum(['terra']).default('terra'),
});

export const CategoryCarouselFeatureDeepRef = z.object({
  __component: z.literal('component.category-carousel-feature'),
  id: z.number().int(),
  description: z.string(),
  link: z.array(z.lazy((): z.ZodType<LinksDeepRef>  => LinksDeepRef)),
  featureCard: z.array(z.lazy((): z.ZodType<FeatureCardDeepRef>  => FeatureCardDeepRef)),
  isFullwidth: nullish(z.boolean().default(true)),
  backgroundColor: z.enum(['terra']).default('terra'),
  title: z.lazy((): z.ZodType<TitleDeepRef>  => TitleDeepRef),
});

export type CategoryCarouselFeatureDeepRef = z.infer<typeof CategoryCarouselFeatureDeepRef>;

export type CategoryCarouselFeature = z.infer<typeof CategoryCarouselFeature>;

export type CategoryCarouselFeatureRef = z.infer<typeof CategoryCarouselFeatureRef>;
