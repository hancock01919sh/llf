import type { ZodType } from 'zod';
import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Navigation = z.object({
  __component: z.literal('component.navigation'),
  id: z.number().int(),
  Title: nullish(z.string()),
  Link: nullish(z.array(z.lazy((): ZodType => LinksRef))),
  Searchplaceholder: nullish(z.string()),
});

export const NavigationRef = z.object({
  __component: z.literal('component.navigation'),
  id: z.number().int(),
  Title: nullish(z.string()),
  Searchplaceholder: nullish(z.string()),
});

export const NavigationDeepRef = z.object({
  __component: z.literal('component.navigation'),
  id: z.number().int(),
  Title: nullish(z.string()),
  Link: nullish(z.array(z.lazy((): ZodType => LinksDeepRef))),
  Searchplaceholder: nullish(z.string()),
});

export type NavigationDeepRef = z.infer<typeof NavigationDeepRef>;

export type Navigation = z.infer<typeof Navigation>;
