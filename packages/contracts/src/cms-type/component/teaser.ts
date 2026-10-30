import { z } from 'zod';
import { Block } from '../blocks';
import { CtaRef } from '../shared/cta';
import { Media } from '../media';
import { TitleRef } from '../shared/title';

export const Teaser = z.object({
  title: TitleRef.optional(),
  description: Block.array().optional(),
  ctas: CtaRef.array().optional(),
  images: Media.array().optional(),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export const TeaserRef = z.object({
  images: Media.array().optional(),
  layout: z.enum(['Basic', 'Highlight', 'Quote']).default('Basic'),
});

export type Teaser = z.infer<typeof Teaser>;
