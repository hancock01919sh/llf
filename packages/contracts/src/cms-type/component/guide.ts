import { z } from 'zod';
import { AssetsCardsRef, AssetsCardsDeepRef } from '../shared/assets-cards';

export const Guide = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  assets: z.array(z.lazy(() => AssetsCardsRef)),
});

export const GuideRef = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
});

export const GuideDeepRef = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  assets: z.array(z.lazy((): z.ZodType<AssetsCardsDeepRef> => AssetsCardsDeepRef)),
});

export type GuideDeepRef = z.infer<typeof GuideDeepRef>;

export type Guide = z.infer<typeof Guide>;

export type GuideRef = z.infer<typeof GuideRef>;
