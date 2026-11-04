import { z } from 'zod';
import { SeoRef } from '../shared/seo';
import { UnknownBlock } from '../blocks';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Page = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  path: z.string(),
  main: z.array(UnknownBlock).default([]),
  seo: nullish(z.lazy(() => SeoRef)),
});

export const PageRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  path: z.string(),
});

export type Page = z.infer<typeof Page>;
