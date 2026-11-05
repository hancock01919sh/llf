import type { ZodType } from 'zod';
import { z } from 'zod';
import { Block } from '../blocks';
import { CtaRef, CtaDeepRef } from '../shared/cta';
import { Media } from '../media';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Teaser = z.object({
  __component: z.literal('component.teaser'),
  id: z.number().int(),
  title: nullish(z.lazy((): ZodType => TitleRef)),
  description: nullish(Block.array()),
  ctas: nullish(z.array(z.lazy((): ZodType => CtaRef))),
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
  title: nullish(z.lazy((): ZodType => TitleDeepRef)),
  description: nullish(Block.array()),
  ctas: nullish(z.array(z.lazy((): ZodType => CtaDeepRef))),
  images: nullish(Media.array()),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export type TeaserDeepRef = z.infer<typeof TeaserDeepRef>;

export type Teaser = z.infer<typeof Teaser>;
