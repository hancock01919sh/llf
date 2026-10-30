import { z } from 'zod';
import {LinksSchema } from '../shared/links';

export const NavigationSchema = z.object({
  Title: z.string().optional(),
  Link: z.lazy((): z.ZodType => LinksSchema).array().optional(),
  Searchplaceholder: z.string().optional(),
});

export type Navigation = z.infer<typeof NavigationSchema>;
