import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const SmallCard = z.object({
  __component: z.literal('shared.small-card'),
  id: z.number().int(),
  Title: z.string(),
  Image: nullish(Media),
});

export const SmallCardRef = z.object({
  __component: z.literal('shared.small-card'),
  id: z.number().int(),
  Title: z.string(),
  Image: nullish(Media),
});

export type SmallCard = z.infer<typeof SmallCard>;
