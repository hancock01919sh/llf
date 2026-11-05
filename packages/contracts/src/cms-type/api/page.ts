import type { ZodType } from 'zod';
import { z } from 'zod';
import { SeoRef, SeoDeepRef } from '../shared/seo';
import { UnknownBlock } from '../blocks';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Page = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  path: z.string(),
  main: z.array(UnknownBlock).default([]),
  seo: nullish(z.lazy((): ZodType => SeoRef)),
});

export const PageRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  path: z.string(),
});

export const PageDeepRef = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  path: z.string(),
  main: z.array(UnknownBlock).default([]),
  seo: nullish(z.lazy((): ZodType => SeoDeepRef)),
});

export type PageDeepRef = z.infer<typeof PageDeepRef>;

export type Page = z.infer<typeof Page>;
