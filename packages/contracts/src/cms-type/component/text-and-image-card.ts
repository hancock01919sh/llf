import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TextAndImageCard = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: Media.array().optional(),
  Background_color: z.enum(['paper']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export const TextAndImageCardRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: Media.array().optional(),
  Background_color: z.enum(['paper']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type TextAndImageCard = z.infer<typeof TextAndImageCard>;
