import { z } from 'zod';
import { StandardCardRef } from '../shared/standard-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CarouselStandard = z.object({
  __component: z.literal('component.carousel-standard'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Background_color: z.enum(['sand', 'paper', 'terra']),
  StandardCard: z.array(z.lazy(() => StandardCardRef)),
  Card_Background_color: nullish(z.enum(['Bright Yellow'])),
  isFullwidth: nullish(z.boolean().default(true)),
});

export const CarouselStandardRef = z.object({
  __component: z.literal('component.carousel-standard'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Background_color: z.enum(['sand', 'paper', 'terra']),
  Card_Background_color: nullish(z.enum(['Bright Yellow'])),
  isFullwidth: nullish(z.boolean().default(true)),
});

export type CarouselStandard = z.infer<typeof CarouselStandard>;
