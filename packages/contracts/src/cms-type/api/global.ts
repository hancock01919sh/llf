import { z } from 'zod';
import { LoadingRef } from '../component/loading';
import { SeoRef } from '../shared/seo';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Global = z.object({
  id: z.number(),
  documentId: z.string(),
  title: nullish(z.string()),
  seo: SeoRef.optional(),
  load: LoadingRef.optional(),
});

export const GlobalRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: nullish(z.string()),
});

export type Global = z.infer<typeof Global>;
