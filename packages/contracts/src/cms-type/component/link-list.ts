import { z } from 'zod';
import { Block } from '../blocks';
import { PageRef } from '../api/page';
import { TitleRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const LinkList = z.object({
  title: TitleRef.optional(),
  description: Block.array().optional(),
  pages: nullish(PageRef.array()),
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export const LinkListRef = z.object({
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export type LinkList = z.infer<typeof LinkList>;
