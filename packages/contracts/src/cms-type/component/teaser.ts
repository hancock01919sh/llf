import { z } from 'zod';
import { Block } from '../blocks';
import { CtaRef } from '../shared/cta';
import { Media } from '../media';
import { TitleRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Teaser = z.object({
  __component: z.literal('component.teaser'),
  id: z.number().int(),
  title: nullish(z.lazy(() => TitleRef)),
  description: nullish(Block.array()),
  ctas: nullish(z.array(z.lazy(() => CtaRef))),
  images: nullish(Media.array()),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export const TeaserRef = z.object({
  __component: z.literal('component.teaser'),
  id: z.number().int(),
  images: nullish(Media.array()),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export const TeaserDeepRef = z.object({
  __component: z.literal('component.teaser'),
  id: z.number().int(),
  images: nullish(Media.array()),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export type TeaserDeepRef = z.infer<typeof TeaserDeepRef>;

export type Teaser = z.infer<typeof Teaser>;
