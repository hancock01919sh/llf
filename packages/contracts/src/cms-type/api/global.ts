import { z } from 'zod';
import { LoadingRef } from '../component/loading';
import { SeoRef } from '../shared/seo';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Global = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  seo: nullish(z.lazy(() => SeoRef)),
  load: z.lazy(() => LoadingRef),
});

export const GlobalRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
});

export type Global = z.infer<typeof Global>;
