import { z } from 'zod';
import { Block } from '../blocks';
import { PageRef, PageDeepRef } from '../api/page';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const LinkList = z.object({
  id: z.number().int(),
  title: nullish(z.lazy(() => TitleRef)),
  description: nullish(Block.array()),
  pages: nullish(z.array(z.lazy(()=> PageRef))),
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export const LinkListRef = z.object({
  id: z.number().int(),
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export const LinkListDeepRef = z.object({
  id: z.number().int(),
  title: nullish(z.lazy((): z.ZodType<TitleDeepRef>  => TitleDeepRef)),
  description: nullish(Block.array()),
  pages: nullish(z.array(z.lazy((): z.ZodType<PageDeepRef> => PageDeepRef))),
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export type LinkListDeepRef = z.infer<typeof LinkListDeepRef>;

export type LinkList = z.infer<typeof LinkList>;

export type LinkListRef = z.infer<typeof LinkListRef>;
