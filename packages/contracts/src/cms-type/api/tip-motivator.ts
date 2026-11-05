import type { ZodType } from 'zod';
import { z } from 'zod';
import { TipRef, TipDeepRef } from '../api/tip';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipMotivator = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  tips: nullish(z.array(z.lazy((): ZodType => TipRef))),
});

export const TipMotivatorRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
});

export const TipMotivatorDeepRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  tips: nullish(z.array(z.lazy((): ZodType => TipDeepRef))),
});

export type TipMotivatorDeepRef = z.infer<typeof TipMotivatorDeepRef>;

export type TipMotivator = z.infer<typeof TipMotivator>;
