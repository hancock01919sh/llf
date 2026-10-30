import { z } from 'zod';
import { MediaSchema } from '../media';
import {LinksSchema } from '../shared/links';

export const InputCardSchema = z.object({
  Title: z.string().optional(),
  Icon: MediaSchema.optional(),
  Link: z.lazy((): z.ZodType => LinksSchema).optional(),
  Description: z.string().optional(),
});

export type InputCard = z.infer<typeof InputCardSchema>;
