import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Loading = z.object({
  Title: z.string(),
  Statement: nullish(z.string()),
  Background_color: z.enum(['forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const LoadingRef = z.object({
  Title: z.string(),
  Statement: nullish(z.string()),
  Background_color: z.enum(['forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const LoadingDeepRef = z.object({
  Title: z.string(),
  Statement: nullish(z.string()),
  Background_color: z.enum(['forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type LoadingDeepRef = z.infer<typeof LoadingDeepRef>;

export type Loading = z.infer<typeof Loading>;
