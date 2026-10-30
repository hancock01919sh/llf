import { z } from 'zod';
import {CategorySchema } from '../api/category';

export const GroupSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  description: z.string().optional(),
  title: z.string(),
  categories: z.lazy((): z.ZodType => CategorySchema).array().optional(),
});

export type Group = z.infer<typeof GroupSchema>;
