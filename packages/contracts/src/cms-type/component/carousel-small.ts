import type { ZodType } from 'zod';
import { z } from 'zod';
import { SmallCardRef, SmallCardDeepRef } from '../shared/small-card';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CarouselSmall = z.object({
  __component: z.literal('component.carousel-small'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  SmallCard: z.array(z.lazy((): ZodType => SmallCardRef)),
  isFullwidth: nullish(z.boolean().default(true)),
  Background_color: z.enum(['paper']),
});

export const CarouselSmallRef = z.object({
  __component: z.literal('component.carousel-small'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  isFullwidth: nullish(z.boolean().default(true)),
  Background_color: z.enum(['paper']),
});

export const CarouselSmallDeepRef = z.object({
  __component: z.literal('component.carousel-small'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  SmallCard: z.array(z.lazy((): ZodType => SmallCardDeepRef)),
  isFullwidth: nullish(z.boolean().default(true)),
  Background_color: z.enum(['paper']),
});

export type CarouselSmallDeepRef = z.infer<typeof CarouselSmallDeepRef>;

export type CarouselSmall = z.infer<typeof CarouselSmall>;
