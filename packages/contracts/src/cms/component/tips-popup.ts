import { z } from 'zod';
import {LinksSchema } from '../shared/links';

export const TipsPopupSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Link: z.lazy((): z.ZodType => LinksSchema).optional(),
});

export type TipsPopup = z.infer<typeof TipsPopupSchema>;
