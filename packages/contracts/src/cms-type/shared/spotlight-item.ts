import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const SpotlightItem = z.object({
  Copy: nullish(z.string()),
  Video: Media.optional(),
});

export const SpotlightItemRef = z.object({
  Copy: nullish(z.string()),
  Video: Media.optional(),
});

export type SpotlightItem = z.infer<typeof SpotlightItem>;
