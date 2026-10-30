import { z } from 'zod';
import { Links } from '../shared/links';

export const Navigation = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string().optional(),
  link: z
    .lazy((): z.ZodType => Links)
    .array()
    .optional(),
  searchPlaceholder: z.string().optional(),
});

export type Navigation = z.infer<typeof Navigation>;
