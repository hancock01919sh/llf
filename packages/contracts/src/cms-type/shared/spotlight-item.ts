import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const SpotlightItem = z.object({
  Copy: z.string(),
  Video: nullish(Media),
});

export const SpotlightItemRef = z.object({
  Copy: z.string(),
  Video: nullish(Media),
});

export type SpotlightItem = z.infer<typeof SpotlightItem>;
