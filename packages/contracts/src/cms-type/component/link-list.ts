import { z } from 'zod';
import { Block } from '../blocks';
import { PageRef } from '../api/page';
import { TitleRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const LinkList = z.object({
  __component: z.literal('component.link-list'),
  id: z.number().int(),
  title: nullish(z.lazy(() => TitleRef)),
  description: nullish(Block.array()),
  pages: nullish(z.array(z.lazy(() => PageRef))),
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export const LinkListRef = z.object({
  __component: z.literal('component.link-list'),
  id: z.number().int(),
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export type LinkList = z.infer<typeof LinkList>;
