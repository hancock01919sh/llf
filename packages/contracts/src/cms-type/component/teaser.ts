import { z } from 'zod';
import { Block } from '../blocks';
import { CtaRef, CtaDeepRef } from '../shared/cta';
import { Media } from '../media';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Teaser = z.object({
  id: z.number().int(),
  title: nullish(z.lazy(() => TitleRef)),
  description: nullish(Block.array()),
  ctas: nullish(z.array(z.lazy(() => CtaRef))),
  images: nullish(Media.array()),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export const TeaserRef = z.object({
  id: z.number().int(),
  images: nullish(Media.array()),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export const TeaserDeepRef = z.object({
  id: z.number().int(),
  title: nullish(z.lazy((): z.ZodType<TitleDeepRef> => TitleDeepRef)),
  description: nullish(Block.array()),
  ctas: nullish(z.array(z.lazy((): z.ZodType<CtaDeepRef> => CtaDeepRef))),
  images: nullish(Media.array()),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export type TeaserDeepRef = z.infer<typeof TeaserDeepRef>;

export type Teaser = z.infer<typeof Teaser>;

export type TeaserRef = z.infer<typeof TeaserRef>;
