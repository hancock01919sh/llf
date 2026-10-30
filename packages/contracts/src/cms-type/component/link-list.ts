import { z } from 'zod';
import { Block } from '../blocks';
import { Page } from '../api/page';
import { Title } from '../shared/title';

export const LinkList = z.object({
  title: z.lazy((): z.ZodType => Title).optional(),
  description: Block.array().optional(),
  pages: z
    .lazy((): z.ZodType => Page)
    .array()
    .optional(),
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export type LinkList = z.infer<typeof LinkList>;
