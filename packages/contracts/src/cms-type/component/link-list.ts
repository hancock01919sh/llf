import type { ZodType } from 'zod';
import { z } from 'zod';
import { Block } from '../blocks';
import { PageRef, PageDeepRef } from '../api/page';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const LinkList = z.object({
  __component: z.literal('component.link-list'),
  id: z.number().int(),
  title: nullish(z.lazy((): ZodType => TitleRef)),
  description: nullish(Block.array()),
  pages: nullish(z.array(z.lazy((): ZodType => PageRef))),
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export const LinkListRef = z.object({
  __component: z.literal('component.link-list'),
  id: z.number().int(),
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export const LinkListDeepRef = z.object({
  __component: z.literal('component.link-list'),
  id: z.number().int(),
  title: nullish(z.lazy((): ZodType => TitleDeepRef)),
  description: nullish(Block.array()),
  pages: nullish(z.array(z.lazy((): ZodType => PageDeepRef))),
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export type LinkListDeepRef = z.infer<typeof LinkListDeepRef>;

export type LinkList = z.infer<typeof LinkList>;
