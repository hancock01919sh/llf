import { z } from 'zod';
import { CategoryRef } from '../api/category';
import { CtaRef } from '../shared/cta';
import { TitleRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Carousel = z.object({
  title: TitleRef.optional(),
  description: nullish(z.string()),
  categories: nullish(CategoryRef.array()),
  mode: z.enum(['categories']).default('categories'),
  layout: z.enum(['Basic', 'Compact']).default('Basic'),
  ctas: CtaRef.array().optional(),
});

export const CarouselRef = z.object({
  description: nullish(z.string()),
  mode: z.enum(['categories']).default('categories'),
  layout: z.enum(['Basic', 'Compact']).default('Basic'),
});

export type Carousel = z.infer<typeof Carousel>;
