import { z } from 'zod';
import {LinksSchema } from '../shared/links';
import {TipSchema } from '../api/tip';

export const TipBannerSchema = z.object({
  Label: z.string().optional(),
  tip: z.lazy((): z.ZodType => TipSchema).optional(),
  CTA: z.lazy((): z.ZodType => LinksSchema).array().optional(),
  Background_color: z.enum(["terra","forest"]).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type TipBanner = z.infer<typeof TipBannerSchema>;
