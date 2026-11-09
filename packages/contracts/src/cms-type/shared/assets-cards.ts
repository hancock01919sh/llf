import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const AssetsCards = z.object({
  title: z.string(),
  description: z.string(),
  label: z.string(),
  image: Media,
  cta: nullish(z.lazy(() => LinksRef)),
  file: nullish(Media),
  displayMode: z.enum(['aspect-16/9', 'aspect-9/16', 'aspect-4/5', 'aspect-1/1', 'aspect-4/5 10 second']),
});

export const AssetsCardsRef = z.object({
  title: z.string(),
  description: z.string(),
  label: z.string(),
  image: Media,
  file: nullish(Media),
  displayMode: z.enum(['aspect-16/9', 'aspect-9/16', 'aspect-4/5', 'aspect-1/1', 'aspect-4/5 10 second']),
});

export const AssetsCardsDeepRef = z.object({
  title: z.string(),
  description: z.string(),
  label: z.string(),
  image: Media,
  cta: nullish(z.lazy((): z.ZodType<LinksDeepRef>  => LinksDeepRef)),
  file: nullish(Media),
  displayMode: z.enum(['aspect-16/9', 'aspect-9/16', 'aspect-4/5', 'aspect-1/1', 'aspect-4/5 10 second']),
});

export type AssetsCardsDeepRef = z.infer<typeof AssetsCardsDeepRef>;

export type AssetsCards = z.infer<typeof AssetsCards>;

export type AssetsCardsRef = z.infer<typeof AssetsCardsRef>;
