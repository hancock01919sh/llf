import { z } from 'zod';
import { CategoryRef, CategoryDeepRef } from '../api/category';
import { CtaRef } from '../shared/cta';
import { TitleRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Carousel = z.object({
  __component: z.literal('component.carousel'),
  id: z.number().int(),
  title: nullish(z.lazy(() => TitleRef)),
  description: nullish(z.string()),
  categories: nullish(z.array(z.lazy(() => CategoryRef))),
  mode: z.enum(['categories']).default('categories'),
  layout: z.enum(['Basic', 'Compact']).default('Basic'),
  ctas: nullish(z.array(z.lazy(() => CtaRef))),
});

export const CarouselRef = z.object({
  __component: z.literal('component.carousel'),
  id: z.number().int(),
  description: nullish(z.string()),
  mode: z.enum(['categories']).default('categories'),
  layout: z.enum(['Basic', 'Compact']).default('Basic'),
});

export const CarouselDeepRef = z.object({
  __component: z.literal('component.carousel'),
  id: z.number().int(),
  description: nullish(z.string()),
  mode: z.enum(['categories']).default('categories'),
  layout: z.enum(['Basic', 'Compact']).default('Basic'),
});

export type CarouselDeepRef = z.infer<typeof CarouselDeepRef>;

export type Carousel = z.infer<typeof Carousel>;
