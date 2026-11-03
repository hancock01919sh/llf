import { z } from 'zod';
import { LinksRef } from '../shared/links';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Navigation = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  link: z.array(z.lazy(() => LinksRef)),
  searchPlaceholder: nullish(z.string()),
});

export const NavigationRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  searchPlaceholder: nullish(z.string()),
});

export type Navigation = z.infer<typeof Navigation>;
