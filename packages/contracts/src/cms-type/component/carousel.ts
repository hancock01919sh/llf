import { z } from 'zod';
import { Category } from '../api/category';
import { Cta } from '../shared/cta';
import { Title } from '../shared/title';

export const Carousel = z.object({
  title: z.lazy((): z.ZodType => Title).optional(),
  description: z.string().optional(),
  categories: z
    .lazy((): z.ZodType => Category)
    .array()
    .optional(),
  mode: z.enum(['categories']).default('categories'),
  layout: z.enum(['Basic', 'Compact']).default('Basic'),
  ctas: z
    .lazy((): z.ZodType => Cta)
    .array()
    .optional(),
});

export type Carousel = z.infer<typeof Carousel>;
