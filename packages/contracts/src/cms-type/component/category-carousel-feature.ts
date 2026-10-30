import { z } from 'zod';
import { FeatureCardRef } from '../shared/feature-card';
import { LinksRef } from '../shared/links';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryCarouselFeature = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Link: nullish(z.array(z.lazy(() => LinksRef))),
  Feature_Card: nullish(z.array(z.lazy(() => FeatureCardRef))),
  isFullwidth: nullish(z.boolean().default(true)),
  Background_color: nullish(z.enum(['terra']).default('terra')),
});

export const CategoryCarouselFeatureRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  isFullwidth: nullish(z.boolean().default(true)),
  Background_color: nullish(z.enum(['terra']).default('terra')),
});

export type CategoryCarouselFeature = z.infer<typeof CategoryCarouselFeature>;
