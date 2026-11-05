import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { TipRef, TipDeepRef } from '../api/tip';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipBanner = z.object({
  __component: z.literal('component.tip-banner'),
  id: z.number().int(),
  label: z.string(),
  tip: nullish(z.lazy(() => TipRef)),
  cta: nullish(z.array(z.lazy(() => LinksRef))),
  backgroundColor: z.enum(['terra', 'forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const TipBannerRef = z.object({
  __component: z.literal('component.tip-banner'),
  id: z.number().int(),
  label: z.string(),
  backgroundColor: z.enum(['terra', 'forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const TipBannerDeepRef = z.object({
  __component: z.literal('component.tip-banner'),
  id: z.number().int(),
  label: z.string(),
  backgroundColor: z.enum(['terra', 'forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type TipBannerDeepRef = z.infer<typeof TipBannerDeepRef>;

export type TipBanner = z.infer<typeof TipBanner>;
