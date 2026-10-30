import { z } from 'zod';
import { Links } from '../shared/links';
import { Tip } from '../api/tip';

export const TipBanner = z.object({
  Label: z.string().optional(),
  tip: z.lazy((): z.ZodType => Tip).optional(),
  CTA: z
    .lazy((): z.ZodType => Links)
    .array()
    .optional(),
  Background_color: z.enum(['terra', 'forest']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type TipBanner = z.infer<typeof TipBanner>;
