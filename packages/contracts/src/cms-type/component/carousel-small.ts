import { z } from 'zod';
import { SmallCardRef } from '../shared/small-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CarouselSmall = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  SmallCard: nullish(z.array(z.lazy(() => SmallCardRef))),
  isFullwidth: nullish(z.boolean().default(true)),
  Background_color: nullish(z.enum(['paper'])),
});

export const CarouselSmallRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  isFullwidth: nullish(z.boolean().default(true)),
  Background_color: nullish(z.enum(['paper'])),
});

export type CarouselSmall = z.infer<typeof CarouselSmall>;
