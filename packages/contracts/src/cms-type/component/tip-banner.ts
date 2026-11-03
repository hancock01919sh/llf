import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { TipRef } from '../api/tip';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipBanner = z.object({
  __component: z.literal('component.tip-banner'),
  id: z.number().int(),
  Label: z.string(),
  tip: nullish(z.lazy(() => TipRef)),
  CTA: nullish(z.array(z.lazy(() => LinksRef))),
  Background_color: z.enum(['terra', 'forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const TipBannerRef = z.object({
  __component: z.literal('component.tip-banner'),
  id: z.number().int(),
  Label: z.string(),
  Background_color: z.enum(['terra', 'forest']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type TipBanner = z.infer<typeof TipBanner>;
