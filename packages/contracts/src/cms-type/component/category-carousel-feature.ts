import { z } from 'zod';
import { FeatureCardRef } from '../shared/feature-card';
import { LinksRef } from '../shared/links';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryCarouselFeature = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Link: nullish(LinksRef.array()),
  Feature_Card: nullish(FeatureCardRef.array()),
  isFullwidth: z.boolean().default(true).optional(),
  Background_color: z.enum(['terra']).default('terra').optional(),
});

export const CategoryCarouselFeatureRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  isFullwidth: z.boolean().default(true).optional(),
  Background_color: z.enum(['terra']).default('terra').optional(),
});

export type CategoryCarouselFeature = z.infer<typeof CategoryCarouselFeature>;
