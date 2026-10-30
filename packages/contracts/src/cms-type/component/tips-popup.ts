import { z } from 'zod';
import { Links } from '../shared/links';

export const TipsPopup = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Link: z.lazy((): z.ZodType => Links).optional(),
});

export type TipsPopup = z.infer<typeof TipsPopup>;
