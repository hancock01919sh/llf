import { z } from 'zod';
import { TipRef, TipDeepRef } from '../api/tip';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipList = z.object({
  title: nullish(z.lazy(() => TitleRef)),
  description: nullish(z.string()),
  tips: nullish(z.array(z.lazy(() => TipRef))),
  layout: z.enum(['Basic', 'Single']).default('Basic'),
});

export const TipListRef = z.object({
  description: nullish(z.string()),
  layout: z.enum(['Basic', 'Single']).default('Basic'),
});

export const TipListDeepRef = z.object({
  title: nullish(z.lazy((): z.ZodType<TitleDeepRef> => TitleDeepRef)),
  description: nullish(z.string()),
  tips: nullish(z.array(z.lazy((): z.ZodType<TipDeepRef> => TipDeepRef))),
  layout: z.enum(['Basic', 'Single']).default('Basic'),
});

export type TipListDeepRef = z.infer<typeof TipListDeepRef>;

export type TipList = z.infer<typeof TipList>;
