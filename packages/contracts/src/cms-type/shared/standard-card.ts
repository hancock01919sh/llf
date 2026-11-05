import { z, ZodType } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const StandardCard = z.object({
  Title: z.string(),
  Image: nullish(Media),
});

export const StandardCardRef = z.object({
  Title: z.string(),
  Image: nullish(Media),
});

export const StandardCardDeepRef = z.object({
  Title: z.string(),
  Image: nullish(Media),
});

export type StandardCardDeepRef = z.infer<typeof StandardCardDeepRef>;

export type StandardCard = z.infer<typeof StandardCard>;
