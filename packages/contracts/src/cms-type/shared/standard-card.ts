import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const StandardCard = z.object({
  __component: z.literal('shared.standard-card'),
  id: z.number().int(),
  Title: z.string(),
  Image: nullish(Media),
});

export const StandardCardRef = z.object({
  __component: z.literal('shared.standard-card'),
  id: z.number().int(),
  Title: z.string(),
  Image: nullish(Media),
});

export type StandardCard = z.infer<typeof StandardCard>;
