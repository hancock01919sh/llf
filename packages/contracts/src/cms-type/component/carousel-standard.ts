import { z } from 'zod';
import { StandardCard } from '../shared/standard-card';

export const CarouselStandard = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Background_color: z.enum(['sand', 'paper', 'terra']).optional(),
  StandardCard: z
    .lazy((): z.ZodType => StandardCard)
    .array()
    .optional(),
  Card_Background_color: z.enum(['Bright Yellow']).optional(),
  isFullwidth: z.boolean().default(true).optional(),
});

export type CarouselStandard = z.infer<typeof CarouselStandard>;
