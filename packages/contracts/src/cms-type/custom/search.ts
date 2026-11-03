import { z } from 'zod';

export const Search = z.object({
  __component: z.literal('custom.search'),
  id: z.number().int(),
  placeholder: z.string().default('Search 100+ ingredients'),
});

export const SearchRef = z.object({
  __component: z.literal('custom.search'),
  id: z.number().int(),
  placeholder: z.string().default('Search 100+ ingredients'),
});

export type Search = z.infer<typeof Search>;
