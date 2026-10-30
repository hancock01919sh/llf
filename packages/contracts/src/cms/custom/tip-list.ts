import { z } from 'zod';
import {TipSchema } from '../api/tip';
import {TitleSchema } from '../shared/title';

export const TipListSchema = z.object({
  title: z.lazy((): z.ZodType => TitleSchema).optional(),
  description: z.string().optional(),
  tips: z.lazy((): z.ZodType => TipSchema).array().optional(),
  layout: z.enum(["Basic","Single"]).default("Basic"),
});

export type TipList = z.infer<typeof TipListSchema>;
