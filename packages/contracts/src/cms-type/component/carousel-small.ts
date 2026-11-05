import { z } from 'zod';
import { SmallCardRef, SmallCardDeepRef } from '../shared/small-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CarouselSmall = z.object({
  __component: z.literal('component.carousel-small'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  smallCard: z.array(z.lazy(() => SmallCardRef)),
  isFullwidth: nullish(z.boolean().default(true)),
  backgroundColor: z.enum(['paper']),
});

export const CarouselSmallRef = z.object({
  __component: z.literal('component.carousel-small'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  isFullwidth: nullish(z.boolean().default(true)),
  backgroundColor: z.enum(['paper']),
});

export const CarouselSmallDeepRef = z.object({
  __component: z.literal('component.carousel-small'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  smallCard: z.array(z.lazy((): z.ZodType<SmallCardDeepRef> => SmallCardDeepRef)),
  isFullwidth: nullish(z.boolean().default(true)),
  backgroundColor: z.enum(['paper']),
});

export type CarouselSmallDeepRef = z.infer<typeof CarouselSmallDeepRef>;

export type CarouselSmall = z.infer<typeof CarouselSmall>;

export type CarouselSmallRef = z.infer<typeof CarouselSmallRef>;
