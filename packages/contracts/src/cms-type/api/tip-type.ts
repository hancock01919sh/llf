import type { ZodType } from 'zod';
import { z } from 'zod';
import { TipRef, TipDeepRef } from '../api/tip';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipType = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  tips: nullish(z.array(z.lazy((): ZodType => TipRef))),
});

export const TipTypeRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
});

export const TipTypeDeepRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  tips: nullish(z.array(z.lazy((): ZodType => TipDeepRef))),
});

export type TipTypeDeepRef = z.infer<typeof TipTypeDeepRef>;

export type TipType = z.infer<typeof TipType>;
