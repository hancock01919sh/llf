import { z } from 'zod';
import { StandardCardRef } from '../shared/standard-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CarouselStandard = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Background_color: nullish(z.enum(['sand', 'paper', 'terra'])),
  StandardCard: nullish(z.array(z.lazy(() => StandardCardRef))),
  Card_Background_color: nullish(z.enum(['Bright Yellow'])),
  isFullwidth: nullish(z.boolean().default(true)),
});

export const CarouselStandardRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Background_color: nullish(z.enum(['sand', 'paper', 'terra'])),
  Card_Background_color: nullish(z.enum(['Bright Yellow'])),
  isFullwidth: nullish(z.boolean().default(true)),
});

export type CarouselStandard = z.infer<typeof CarouselStandard>;
