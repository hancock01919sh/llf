import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { TipRef } from '../api/tip';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipBanner = z.object({
  Label: nullish(z.string()),
  tip: nullish(TipRef),
  CTA: nullish(LinksRef.array()),
  Background_color: z.enum(['terra', 'forest']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export const TipBannerRef = z.object({
  Label: nullish(z.string()),
  Background_color: z.enum(['terra', 'forest']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type TipBanner = z.infer<typeof TipBanner>;
