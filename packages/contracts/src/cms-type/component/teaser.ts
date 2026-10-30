import { z } from 'zod';
import { Block } from '../blocks';
import { Cta } from '../shared/cta';
import { Media } from '../media';
import { Title } from '../shared/title';

export const Teaser = z.object({
  title: z.lazy((): z.ZodType => Title).optional(),
  description: Block.array().optional(),
  ctas: z
    .lazy((): z.ZodType => Cta)
    .array()
    .optional(),
  images: Media.array().optional(),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export type Teaser = z.infer<typeof Teaser>;
