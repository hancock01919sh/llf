import { z } from 'zod';
import { Category } from '../api/category';

export const Group = z.object({
  id: z.number(),
  documentId: z.string(),
  description: z.string().optional(),
  title: z.string(),
  categories: z
    .lazy((): z.ZodType => Category)
    .array()
    .optional(),
});

export type Group = z.infer<typeof Group>;
