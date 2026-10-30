import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const StandardCard = z.object({
  Title: nullish(z.string()),
  Image: Media.optional(),
});

export const StandardCardRef = z.object({
  Title: nullish(z.string()),
  Image: Media.optional(),
});

export type StandardCard = z.infer<typeof StandardCard>;
