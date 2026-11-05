import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Loading = z.object({
  id: z.number().int(),
  title: z.string(),
  statement: nullish(z.string()),
  backgroundColor: z.enum(['forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const LoadingRef = z.object({
  id: z.number().int(),
  title: z.string(),
  statement: nullish(z.string()),
  backgroundColor: z.enum(['forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const LoadingDeepRef = z.object({
  id: z.number().int(),
  title: z.string(),
  statement: nullish(z.string()),
  backgroundColor: z.enum(['forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type LoadingDeepRef = z.infer<typeof LoadingDeepRef>;

export type Loading = z.infer<typeof Loading>;

export type LoadingRef = z.infer<typeof LoadingRef>;
