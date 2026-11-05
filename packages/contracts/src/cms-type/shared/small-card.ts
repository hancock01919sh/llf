import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const SmallCard = z.object({
  title: z.string(),
  image: nullish(Media),
});

export const SmallCardRef = z.object({
  title: z.string(),
  image: nullish(Media),
});

export const SmallCardDeepRef = z.object({
  title: z.string(),
  image: nullish(Media),
});

export type SmallCardDeepRef = z.infer<typeof SmallCardDeepRef>;

export type SmallCard = z.infer<typeof SmallCard>;

export type SmallCardRef = z.infer<typeof SmallCardRef>;
