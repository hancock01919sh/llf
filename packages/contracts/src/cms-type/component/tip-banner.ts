import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { TipRef } from '../api/tip';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipBanner = z.object({
  Label: nullish(z.string()),
  tip: nullish(z.lazy(() => TipRef)),
  CTA: nullish(z.array(z.lazy(() => LinksRef))),
  Background_color: nullish(z.enum(['terra', 'forest'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const TipBannerRef = z.object({
  Label: nullish(z.string()),
  Background_color: nullish(z.enum(['terra', 'forest'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type TipBanner = z.infer<typeof TipBanner>;
