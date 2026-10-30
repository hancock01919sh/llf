import { z } from 'zod';
import { FeatureCard } from '../shared/feature-card';
import { Links } from '../shared/links';

export const CategoryCarouselFeature = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Link: z
    .lazy((): z.ZodType => Links)
    .array()
    .optional(),
  Feature_Card: z
    .lazy((): z.ZodType => FeatureCard)
    .array()
    .optional(),
  isFullwidth: z.boolean().default(true).optional(),
  Background_color: z.enum(['terra']).default('terra').optional(),
});

export type CategoryCarouselFeature = z.infer<typeof CategoryCarouselFeature>;
