import { z } from 'zod';
import {FeatureCardSchema } from '../shared/feature-card';
import {LinksSchema } from '../shared/links';

export const CategoryCarouselFeatureSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Link: z.lazy((): z.ZodType => LinksSchema).array().optional(),
  Feature_Card: z.lazy((): z.ZodType => FeatureCardSchema).array().optional(),
  isFullwidth: z.boolean().default(true).optional(),
  Background_color: z.enum(["terra"]).default("terra").optional(),
});

export type CategoryCarouselFeature = z.infer<typeof CategoryCarouselFeatureSchema>;
