import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Loading = z.object({
  Title: nullish(z.string()),
  Statement: nullish(z.string()),
  Background_color: z.enum(['forest']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export const LoadingRef = z.object({
  Title: nullish(z.string()),
  Statement: nullish(z.string()),
  Background_color: z.enum(['forest']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type Loading = z.infer<typeof Loading>;
