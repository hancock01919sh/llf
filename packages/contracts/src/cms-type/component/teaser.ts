import { z } from 'zod';
import { Block } from '../blocks';
import { CtaRef } from '../shared/cta';
import { Media } from '../media';
import { TitleRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Teaser = z.object({
  title: nullish(z.lazy(() => TitleRef)),
  description: nullish(Block.array()),
  ctas: nullish(z.array(z.lazy(() => CtaRef))),
  images: nullish(Media.array()),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export const TeaserRef = z.object({
  images: nullish(Media.array()),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export type Teaser = z.infer<typeof Teaser>;
