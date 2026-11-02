import { z } from 'zod';

export const Search = z.object({
  placeholder: z.string().default('Search 100+ ingredients'),
});

export const SearchRef = z.object({
  placeholder: z.string().default('Search 100+ ingredients'),
});

export type Search = z.infer<typeof Search>;
