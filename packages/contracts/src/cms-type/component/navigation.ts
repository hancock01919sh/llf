import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Navigation = z.object({
  id: z.number().int(),
  Title: nullish(z.string()),
  Link: nullish(z.array(z.lazy(() => LinksRef))),
  Searchplaceholder: nullish(z.string()),
});

export const NavigationRef = z.object({
  id: z.number().int(),
  Title: nullish(z.string()),
  Searchplaceholder: nullish(z.string()),
});

export const NavigationDeepRef = z.object({
  id: z.number().int(),
  Title: nullish(z.string()),
  Link: nullish(z.array(z.lazy((): z.ZodType<LinksDeepRef> => LinksDeepRef))),
  Searchplaceholder: nullish(z.string()),
});

export type NavigationDeepRef = z.infer<typeof NavigationDeepRef>;

export type Navigation = z.infer<typeof Navigation>;
