import type { ZodType } from 'zod';
import { z } from 'zod';
import { StandardCardRef, StandardCardDeepRef } from '../shared/standard-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CarouselStandard = z.object({
  __component: z.literal('component.carousel-standard'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Background_color: z.enum(['sand', 'paper', 'terra']),
  StandardCard: z.array(z.lazy((): ZodType => StandardCardRef)),
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

export const CarouselStandardDeepRef = z.object({
  __component: z.literal('component.carousel-standard'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Background_color: z.enum(['sand', 'paper', 'terra']),
  StandardCard: z.array(z.lazy((): ZodType => StandardCardDeepRef)),
  Card_Background_color: nullish(z.enum(['Bright Yellow'])),
  isFullwidth: nullish(z.boolean().default(true)),
});

export type CarouselStandardDeepRef = z.infer<typeof CarouselStandardDeepRef>;

export type CarouselStandard = z.infer<typeof CarouselStandard>;
