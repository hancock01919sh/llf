import { z } from 'zod';
import { FeatureCardRef } from '../shared/feature-card';
import { LinksRef } from '../shared/links';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryCarouselFeature = z.object({
  __component: z.literal('component.category-carousel-feature'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Link: z.array(z.lazy(() => LinksRef)),
  Feature_Card: z.array(z.lazy(() => FeatureCardRef)),
  isFullwidth: nullish(z.boolean().default(true)),
  Background_color: z.enum(['terra']).default('terra'),
});

export const CategoryCarouselFeatureRef = z.object({
  __component: z.literal('component.category-carousel-feature'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  isFullwidth: nullish(z.boolean().default(true)),
  Background_color: z.enum(['terra']).default('terra'),
});

export type CategoryCarouselFeature = z.infer<typeof CategoryCarouselFeature>;
