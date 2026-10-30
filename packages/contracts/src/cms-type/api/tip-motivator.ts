import { z } from 'zod';
import { Tip } from '../api/tip';

export const TipMotivator = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  tips: z
    .lazy((): z.ZodType => Tip)
    .array()
    .optional(),
});

export type TipMotivator = z.infer<typeof TipMotivator>;
