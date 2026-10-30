import { z } from 'zod';
import { Tip } from '../api/tip';
import { Title } from '../shared/title';

export const TipList = z.object({
  title: z.lazy((): z.ZodType => Title).optional(),
  description: z.string().optional(),
  tips: z
    .lazy((): z.ZodType => Tip)
    .array()
    .optional(),
  layout: z.enum(['Basic', 'Single']).default('Basic'),
});

export type TipList = z.infer<typeof TipList>;
