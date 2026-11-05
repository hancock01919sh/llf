import type { ZodType } from 'zod';
import { z } from 'zod';
import { AssetsCardsRef, AssetsCardsDeepRef } from '../shared/assets-cards';

export const Guide = z.object({
  __component: z.literal('component.guide'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Assets: z.array(z.lazy((): ZodType => AssetsCardsRef)),
});

export const GuideRef = z.object({
  __component: z.literal('component.guide'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
});

export const GuideDeepRef = z.object({
  __component: z.literal('component.guide'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Assets: z.array(z.lazy((): ZodType => AssetsCardsDeepRef)),
});

export type GuideDeepRef = z.infer<typeof GuideDeepRef>;

export type Guide = z.infer<typeof Guide>;
