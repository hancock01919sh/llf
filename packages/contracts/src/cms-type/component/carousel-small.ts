import { z } from 'zod';
import { SmallCard } from '../shared/small-card';

export const CarouselSmall = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  SmallCard: z
    .lazy((): z.ZodType => SmallCard)
    .array()
    .optional(),
  isFullwidth: z.boolean().default(true).optional(),
  Background_color: z.enum(['paper']).optional(),
});

export type CarouselSmall = z.infer<typeof CarouselSmall>;
