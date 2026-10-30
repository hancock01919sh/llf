import { z } from 'zod';
import { Links } from '../shared/links';
import { Media } from '../media';

export const InputCard = z.object({
  Title: z.string().optional(),
  Icon: Media.optional(),
  Link: z.lazy((): z.ZodType => Links).optional(),
  Description: z.string().optional(),
});

export type InputCard = z.infer<typeof InputCard>;
