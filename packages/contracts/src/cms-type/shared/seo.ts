import { z } from 'zod';

export const Seo = z.object({
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

export type Seo = z.infer<typeof Seo>;
