import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const SmallCard = z.object({
  Title: nullish(z.string()),
  Image: Media.optional(),
});

export const SmallCardRef = z.object({
  Title: nullish(z.string()),
  Image: Media.optional(),
});

export type SmallCard = z.infer<typeof SmallCard>;
