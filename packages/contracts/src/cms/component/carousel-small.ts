import { z } from 'zod';
import {SmallCardSchema } from '../shared/small-card';

export const CarouselSmallSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  SmallCard: z.lazy((): z.ZodType => SmallCardSchema).array().optional(),
  isFullwidth: z.boolean().default(true).optional(),
  Background_color: z.enum(["paper"]).optional(),
});

export type CarouselSmall = z.infer<typeof CarouselSmallSchema>;
