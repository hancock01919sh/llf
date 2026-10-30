import { z } from 'zod';
import { StandardCardRef } from '../shared/standard-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CarouselStandard = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Background_color: z.enum(['sand', 'paper', 'terra']).optional(),
  StandardCard: StandardCardRef.array().optional(),
  Card_Background_color: z.enum(['Bright Yellow']).optional(),
  isFullwidth: z.boolean().default(true).optional(),
});

export const CarouselStandardRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Background_color: z.enum(['sand', 'paper', 'terra']).optional(),
  Card_Background_color: z.enum(['Bright Yellow']).optional(),
  isFullwidth: z.boolean().default(true).optional(),
});

export type CarouselStandard = z.infer<typeof CarouselStandard>;
