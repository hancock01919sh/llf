import { z } from 'zod';
import { SmallCardRef } from '../shared/small-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CarouselSmall = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  SmallCard: nullish(SmallCardRef.array()),
  isFullwidth: z.boolean().default(true).optional(),
  Background_color: z.enum(['paper']).optional(),
});

export const CarouselSmallRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  isFullwidth: z.boolean().default(true).optional(),
  Background_color: z.enum(['paper']).optional(),
});

export type CarouselSmall = z.infer<typeof CarouselSmall>;
