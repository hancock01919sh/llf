import { z } from 'zod';
import { CategoryRef, CategoryDeepRef } from '../api/category';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Group = z.object({
  id: z.number(),
  documentId: z.string(),
  description: nullish(z.string()),
  title: z.string(),
  categories: nullish(z.array(z.lazy(()=> CategoryRef))),
});

export const GroupRef = z.object({
  id: z.number(),
  documentId: z.string(),
  description: nullish(z.string()),
  title: z.string(),
});

export const GroupDeepRef = z.object({
  id: z.number(),
  documentId: z.string(),
  description: nullish(z.string()),
  title: z.string(),
  categories: nullish(z.array(z.lazy((): z.ZodType=> CategoryDeepRef))),
});

export type GroupDeepRef = z.infer<typeof GroupDeepRef>;

export type Group = z.infer<typeof Group>;

export type GroupRef = z.infer<typeof GroupRef>;
