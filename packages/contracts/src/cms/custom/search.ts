import { z } from 'zod';

export const SearchSchema = z.object({
  placeholder: z.string().default("Search 100+ ingredients"),
});

export type Search = z.infer<typeof SearchSchema>;
