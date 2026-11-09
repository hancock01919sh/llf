import { z } from 'zod';
import { CategoryRef, CategoryDeepRef } from '../api/category';
import { CtaRef, CtaDeepRef } from '../shared/cta';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Carousel = z.object({
  id: z.number().int(),
  title: nullish(z.lazy(() => TitleRef)),
  description: nullish(z.string()),
  categories: nullish(z.array(z.lazy(()=> CategoryRef))),
  mode: z.enum(['categories']).default('categories'),
  layout: z.enum(['Basic', 'Compact']).default('Basic'),
  ctas: nullish(z.array(z.lazy(() => CtaRef))),
});

export const CarouselRef = z.object({
  id: z.number().int(),
  description: nullish(z.string()),
  mode: z.enum(['categories']).default('categories'),
  layout: z.enum(['Basic', 'Compact']).default('Basic'),
});

export const CarouselDeepRef = z.object({
  id: z.number().int(),
  title: nullish(z.lazy((): z.ZodType<TitleDeepRef>  => TitleDeepRef)),
  description: nullish(z.string()),
  categories: nullish(z.array(z.lazy((): z.ZodType<CategoryDeepRef> => CategoryDeepRef))),
  mode: z.enum(['categories']).default('categories'),
  layout: z.enum(['Basic', 'Compact']).default('Basic'),
  ctas: nullish(z.array(z.lazy((): z.ZodType<CtaDeepRef>  => CtaDeepRef))),
});

export type CarouselDeepRef = z.infer<typeof CarouselDeepRef>;

export type Carousel = z.infer<typeof Carousel>;

export type CarouselRef = z.infer<typeof CarouselRef>;
