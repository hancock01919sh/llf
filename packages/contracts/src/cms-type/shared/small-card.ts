import { z, ZodType } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const SmallCard = z.object({
  Title: z.string(),
  Image: nullish(Media),
});

export const SmallCardRef = z.object({
  Title: z.string(),
  Image: nullish(Media),
});

export const SmallCardDeepRef = z.object({
  Title: z.string(),
  Image: nullish(Media),
});

export type SmallCardDeepRef = z.infer<typeof SmallCardDeepRef>;

export type SmallCard = z.infer<typeof SmallCard>;
