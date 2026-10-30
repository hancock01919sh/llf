import { z } from 'zod';
import { AssetsCards } from '../shared/assets-cards';

export const Guide = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Label1: z.string().optional(),
  Asset1: z
    .lazy((): z.ZodType => AssetsCards)
    .array()
    .optional(),
  Label2: z.string().optional(),
  Asset2: z
    .lazy((): z.ZodType => AssetsCards)
    .array()
    .optional(),
});

export type Guide = z.infer<typeof Guide>;
