import { z } from 'zod';
import { LinksRef } from '../shared/links';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Navigation = z.object({
  Title: nullish(z.string()),
  Link: LinksRef.array().optional(),
  Searchplaceholder: nullish(z.string()),
});

export const NavigationRef = z.object({
  Title: nullish(z.string()),
  Searchplaceholder: nullish(z.string()),
});

export type Navigation = z.infer<typeof Navigation>;
