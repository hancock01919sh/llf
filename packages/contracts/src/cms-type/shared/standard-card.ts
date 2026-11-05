import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const StandardCard = z.object({
  title: z.string(),
  image: nullish(Media),
});

export const StandardCardRef = z.object({
  title: z.string(),
  image: nullish(Media),
});

export const StandardCardDeepRef = z.object({
  title: z.string(),
  image: nullish(Media),
});

export type StandardCardDeepRef = z.infer<typeof StandardCardDeepRef>;

export type StandardCard = z.infer<typeof StandardCard>;

export type StandardCardRef = z.infer<typeof StandardCardRef>;
