import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const SpotlightItem = z.object({
  __component: z.literal('shared.spotlight-item'),
  id: z.number().int(),
  Copy: z.string(),
  Video: nullish(Media),
});

export const SpotlightItemRef = z.object({
  __component: z.literal('shared.spotlight-item'),
  id: z.number().int(),
  Copy: z.string(),
  Video: nullish(Media),
});

export type SpotlightItem = z.infer<typeof SpotlightItem>;
