import { z } from 'zod';
import { BlockSchema } from '../blocks';
import { PageSchema } from '../api/page';
import { TitleSchema } from '../shared/title';

export const LinkListSchema = z.object({
  title: z.lazy((): z.ZodType => TitleSchema).optional(),
  description: BlockSchema.array().optional(),
  pages: z
    .lazy((): z.ZodType => PageSchema)
    .array()
    .optional(),
  layout: z.enum(['Basic', 'Two Column']).default('Basic'),
});

export type LinkList = z.infer<typeof LinkListSchema>;
