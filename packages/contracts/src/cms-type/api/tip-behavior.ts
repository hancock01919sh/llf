import { z } from 'zod';
import { Tip } from '../api/tip';

export const TipBehavior = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  tips: z
    .lazy((): z.ZodType => Tip)
    .array()
    .optional(),
});

export type TipBehavior = z.infer<typeof TipBehavior>;
