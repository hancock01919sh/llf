import { z } from 'zod';
import { AssetsCardsRef } from '../shared/assets-cards';

export const Guide = z.object({
  __component: z.literal('component.guide'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Assets: z.array(z.lazy(() => AssetsCardsRef)),
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
});

export type GuideDeepRef = z.infer<typeof GuideDeepRef>;

export type Guide = z.infer<typeof Guide>;
