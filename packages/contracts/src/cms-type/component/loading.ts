import { z } from 'zod';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Loading = z.object({
  id: z.number().int(),
  statement: nullish(z.string()),
  backgroundColor: z.enum(['forest']),
  isFullwidth: nullish(z.boolean().default(false)),
  title: z.lazy(() => TitleRef),
});

export const LoadingRef = z.object({
  id: z.number().int(),
  statement: nullish(z.string()),
  backgroundColor: z.enum(['forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const LoadingDeepRef = z.object({
  id: z.number().int(),
  statement: nullish(z.string()),
  backgroundColor: z.enum(['forest']),
  isFullwidth: nullish(z.boolean().default(false)),
  title: z.lazy((): z.ZodType<TitleDeepRef>  => TitleDeepRef),
});

export type LoadingDeepRef = z.infer<typeof LoadingDeepRef>;

export type Loading = z.infer<typeof Loading>;

export type LoadingRef = z.infer<typeof LoadingRef>;
