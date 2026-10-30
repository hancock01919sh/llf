import { z } from 'zod';
import { Tip } from '../api/tip';

export const TipType = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  tips: z
    .lazy((): z.ZodType => Tip)
    .array()
    .optional(),
});

export type TipType = z.infer<typeof TipType>;
