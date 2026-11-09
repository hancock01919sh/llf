import { z } from 'zod';
import { AssetsCardsRef, AssetsCardsDeepRef } from '../shared/assets-cards';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Guide = z.object({
  id: z.number().int(),
  description: z.string(),
  assets: z.array(z.lazy(() => AssetsCardsRef)),
  title: z.lazy(() => TitleRef),
  backgroundColor: nullish(z.enum(['paper'])),
});

export const GuideRef = z.object({
  id: z.number().int(),
  description: z.string(),
  backgroundColor: nullish(z.enum(['paper'])),
});

export const GuideDeepRef = z.object({
  id: z.number().int(),
  description: z.string(),
  assets: z.array(z.lazy((): z.ZodType<AssetsCardsDeepRef>  => AssetsCardsDeepRef)),
  title: z.lazy((): z.ZodType<TitleDeepRef>  => TitleDeepRef),
  backgroundColor: nullish(z.enum(['paper'])),
});

export type GuideDeepRef = z.infer<typeof GuideDeepRef>;

export type Guide = z.infer<typeof Guide>;

export type GuideRef = z.infer<typeof GuideRef>;
