import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Loading = z.object({
  id: z.number().int(),
  Title: z.string(),
  Statement: nullish(z.string()),
  Background_color: z.enum(['forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const LoadingRef = z.object({
  __component: z.literal('component.loading'),
  id: z.number().int(),
  Title: z.string(),
  Statement: nullish(z.string()),
  Background_color: z.enum(['forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type Loading = z.infer<typeof Loading>;
