import { z } from 'zod';
import { LoadingRef, LoadingDeepRef } from '../component/loading';
import { SeoRef, SeoDeepRef } from '../shared/seo';

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

export const GlobalDeepRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  seo: nullish(z.lazy((): z.ZodType<SeoDeepRef>  => SeoDeepRef)),
  load: z.lazy((): z.ZodType<LoadingDeepRef>  => LoadingDeepRef),
});

export type GlobalDeepRef = z.infer<typeof GlobalDeepRef>;

export type Global = z.infer<typeof Global>;

export type GlobalRef = z.infer<typeof GlobalRef>;
