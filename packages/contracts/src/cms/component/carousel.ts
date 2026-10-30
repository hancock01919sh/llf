import { z } from 'zod';
import { CategorySchema } from '../api/category';
import { CtaSchema } from '../shared/cta';
import { TitleSchema } from '../shared/title';

export const CarouselSchema = z.object({
  title: z.lazy((): z.ZodType => TitleSchema).optional(),
  description: z.string().optional(),
  categories: z
    .lazy((): z.ZodType => CategorySchema)
    .array()
    .optional(),
  mode: z.enum(['categories']).default('categories'),
  layout: z.enum(['Basic', 'Compact']).default('Basic'),
  ctas: z
    .lazy((): z.ZodType => CtaSchema)
    .array()
    .optional(),
});

export type Carousel = z.infer<typeof CarouselSchema>;
