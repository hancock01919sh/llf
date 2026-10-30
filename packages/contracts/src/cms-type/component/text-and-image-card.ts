import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TextAndImageCard = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media.array()),
  Background_color: nullish(z.enum(['paper'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const TextAndImageCardRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media.array()),
  Background_color: nullish(z.enum(['paper'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type TextAndImageCard = z.infer<typeof TextAndImageCard>;
