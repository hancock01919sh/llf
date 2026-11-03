import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Seo = z.object({
  __component: z.literal('shared.seo'),
  id: z.number().int(),
  metaTitle: nullish(z.string()),
  metaKeywords: nullish(z.string()),
  metaDescription: nullish(z.string()),
});

export const SeoRef = z.object({
  __component: z.literal('shared.seo'),
  id: z.number().int(),
  metaTitle: nullish(z.string()),
  metaKeywords: nullish(z.string()),
  metaDescription: nullish(z.string()),
});

export type Seo = z.infer<typeof Seo>;
