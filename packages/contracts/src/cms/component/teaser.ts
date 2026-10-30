import { z } from 'zod';
import { BlockSchema } from '../blocks';
import { MediaSchema } from '../media';
import { CtaSchema } from '../shared/cta';
import { TitleSchema } from '../shared/title';

export const TeaserSchema = z.object({
  title: z.lazy((): z.ZodType => TitleSchema).optional(),
  description: BlockSchema.array().optional(),
  ctas: z
    .lazy((): z.ZodType => CtaSchema)
    .array()
    .optional(),
  images: MediaSchema.array().optional(),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export type Teaser = z.infer<typeof TeaserSchema>;
