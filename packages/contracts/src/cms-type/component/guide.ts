import { z } from 'zod';
import { AssetsCardsRef } from '../shared/assets-cards';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Guide = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Label1: nullish(z.string()),
  Asset1: AssetsCardsRef.array().optional(),
  Label2: nullish(z.string()),
  Asset2: AssetsCardsRef.array().optional(),
});

export const GuideRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Label1: nullish(z.string()),
  Label2: nullish(z.string()),
});

export type Guide = z.infer<typeof Guide>;
