import { z } from 'zod';
import { AssetsCardsRef, AssetsCardsDeepRef } from '../shared/assets-cards';

export const Guide = z.object({
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Assets: z.array(z.lazy(() => AssetsCardsRef)),
});

export const GuideRef = z.object({
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
});

export const GuideDeepRef = z.object({
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Assets: z.array(z.lazy((): z.ZodType<AssetsCardsDeepRef> => AssetsCardsDeepRef)),
});

export type GuideDeepRef = z.infer<typeof GuideDeepRef>;

export type Guide = z.infer<typeof Guide>;
