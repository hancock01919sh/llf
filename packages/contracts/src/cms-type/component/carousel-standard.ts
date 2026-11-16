import { z } from 'zod';
import { StandardCardRef, StandardCardDeepRef } from '../shared/standard-card';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CarouselStandard = z.object({
  __component: z.literal('component.carousel-standard'),
  id: z.number().int(),
  description: z.string(),
  backgroundColor: z.enum(['sand', 'paper', 'terra']),
  standardCard: z.array(z.lazy(() => StandardCardRef)),
  cardBackgroundColor: nullish(z.enum(['Bright Yellow'])),
  isFullwidth: nullish(z.boolean().default(true)),
  title: z.lazy(() => TitleRef),
});

export const CarouselStandardRef = z.object({
  __component: z.literal('component.carousel-standard'),
  id: z.number().int(),
  description: z.string(),
  backgroundColor: z.enum(['sand', 'paper', 'terra']),
  cardBackgroundColor: nullish(z.enum(['Bright Yellow'])),
  isFullwidth: nullish(z.boolean().default(true)),
});

export const CarouselStandardDeepRef = z.object({
  __component: z.literal('component.carousel-standard'),
  id: z.number().int(),
  description: z.string(),
  backgroundColor: z.enum(['sand', 'paper', 'terra']),
  standardCard: z.array(z.lazy((): z.ZodType<StandardCardDeepRef> => StandardCardDeepRef)),
  cardBackgroundColor: nullish(z.enum(['Bright Yellow'])),
  isFullwidth: nullish(z.boolean().default(true)),
  title: z.lazy((): z.ZodType<TitleDeepRef> => TitleDeepRef),
});

export type CarouselStandardDeepRef = z.infer<typeof CarouselStandardDeepRef>;

export type CarouselStandard = z.infer<typeof CarouselStandard>;

export type CarouselStandardRef = z.infer<typeof CarouselStandardRef>;
