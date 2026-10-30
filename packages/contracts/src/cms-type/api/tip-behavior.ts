import { z } from 'zod';
import { TipRef } from '../api/tip';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipBehavior = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  tips: nullish(z.array(z.lazy(() => TipRef))),
});

export const TipBehaviorRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
});

export type TipBehavior = z.infer<typeof TipBehavior>;
