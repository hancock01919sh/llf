import { z } from 'zod';
import { Links } from '../shared/links';

export const Navigation = z.object({
  Title: z.string().optional(),
  Link: z
    .lazy((): z.ZodType => Links)
    .array()
    .optional(),
  Searchplaceholder: z.string().optional(),
});

export type Navigation = z.infer<typeof Navigation>;
