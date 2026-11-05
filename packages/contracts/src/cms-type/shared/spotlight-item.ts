import { z, ZodType } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const SpotlightItem = z.object({
  copy: z.string(),
  video: nullish(Media),
});

export const SpotlightItemRef = z.object({
  copy: z.string(),
  video: nullish(Media),
});

export const SpotlightItemDeepRef = z.object({
  copy: z.string(),
  video: nullish(Media),
});

export type SpotlightItemDeepRef = z.infer<typeof SpotlightItemDeepRef>;

export type SpotlightItem = z.infer<typeof SpotlightItem>;
