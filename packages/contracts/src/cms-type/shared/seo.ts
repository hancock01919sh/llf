import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Seo = z.object({
  metaTitle: nullish(z.string()),
  metaKeywords: nullish(z.string()),
  metaDescription: nullish(z.string()),
});

export const SeoRef = z.object({
  metaTitle: nullish(z.string()),
  metaKeywords: nullish(z.string()),
  metaDescription: nullish(z.string()),
});

export type Seo = z.infer<typeof Seo>;
