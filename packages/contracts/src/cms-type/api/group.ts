import { z } from 'zod';
import { CategoryRef } from '../api/category';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Group = z.object({
  id: z.number(),
  documentId: z.string(),
  description: nullish(z.string()),
  title: z.string(),
  categories: nullish(z.array(z.lazy(() => CategoryRef))),
});

export const GroupRef = z.object({
  id: z.number(),
  documentId: z.string(),
  description: nullish(z.string()),
  title: z.string(),
});

export type Group = z.infer<typeof Group>;
