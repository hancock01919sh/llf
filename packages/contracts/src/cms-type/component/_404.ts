import { z } from 'zod';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const _404 = z.object({
  __component: z.literal('component.404'),
  id: z.number().int(),
  description: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
  title: z.lazy(() => TitleRef),
});

export const _404Ref = z.object({
  __component: z.literal('component.404'),
  id: z.number().int(),
  description: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
});

export const _404DeepRef = z.object({
  __component: z.literal('component.404'),
  id: z.number().int(),
  description: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
  title: z.lazy((): z.ZodType<TitleDeepRef> => TitleDeepRef),
});

export type _404DeepRef = z.infer<typeof _404DeepRef>;

export type _404 = z.infer<typeof _404>;

export type _404Ref = z.infer<typeof _404Ref>;
