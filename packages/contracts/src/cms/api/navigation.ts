import { z } from 'zod';
import { LinksSchema } from '../shared/links';

export const NavigationSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string().optional(),
  link: z
    .lazy((): z.ZodType => LinksSchema)
    .array()
    .optional(),
  searchPlaceholder: z.string().optional(),
});

export type Navigation = z.infer<typeof NavigationSchema>;
