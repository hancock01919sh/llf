import { z } from 'zod';
import { TipRef } from '../api/tip';
import { TitleRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipList = z.object({
  title: TitleRef.optional(),
  description: nullish(z.string()),
  tips: nullish(TipRef.array()),
  layout: z.enum(['Basic', 'Single']).default('Basic'),
});

export const TipListRef = z.object({
  description: nullish(z.string()),
  layout: z.enum(['Basic', 'Single']).default('Basic'),
});

export type TipList = z.infer<typeof TipList>;
