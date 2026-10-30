import { z } from 'zod';
import {TipSchema } from '../api/tip';

export const TipTypeSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  tips: z.lazy((): z.ZodType => TipSchema).array().optional(),
});

export type TipType = z.infer<typeof TipTypeSchema>;
