import { z } from 'zod';
import { StandardCardSchema } from '../shared/standard-card';

export const CarouselStandardSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Background_color: z.enum(['sand', 'paper', 'terra']).optional(),
  StandardCard: z
    .lazy((): z.ZodType => StandardCardSchema)
    .array()
    .optional(),
  Card_Background_color: z.enum(['Bright Yellow']).optional(),
  isFullwidth: z.boolean().default(true).optional(),
});

export type CarouselStandard = z.infer<typeof CarouselStandardSchema>;
