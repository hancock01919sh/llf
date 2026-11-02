import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Loading = z.object({
  Title: nullish(z.string()),
  Statement: nullish(z.string()),
  Background_color: nullish(z.enum(['forest'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const LoadingRef = z.object({
  Title: nullish(z.string()),
  Statement: nullish(z.string()),
  Background_color: nullish(z.enum(['forest'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type Loading = z.infer<typeof Loading>;
