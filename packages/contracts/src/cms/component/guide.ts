import { z } from 'zod';
import {AssetsCardsSchema } from '../shared/assets-cards';

export const GuideSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Label1: z.string().optional(),
  Asset1: z.lazy((): z.ZodType => AssetsCardsSchema).array().optional(),
  Label2: z.string().optional(),
  Asset2: z.lazy((): z.ZodType => AssetsCardsSchema).array().optional(),
});

export type Guide = z.infer<typeof GuideSchema>;
