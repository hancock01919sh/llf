import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const AssetsCards = z.object({
  Title: z.string(),
  Description: z.string(),
  Label: z.string(),
  Image: Media,
  CTA: nullish(z.lazy(() => LinksRef)),
  File: nullish(Media),
  Display_Mode: z.enum([
    'aspect-16/9',
    'aspect-9/16',
    'aspect-4/5',
    'aspect-1/1',
    'aspect-4/5 10 second',
  ]),
});

export const AssetsCardsRef = z.object({
  Title: z.string(),
  Description: z.string(),
  Label: z.string(),
  Image: Media,
  File: nullish(Media),
  Display_Mode: z.enum([
    'aspect-16/9',
    'aspect-9/16',
    'aspect-4/5',
    'aspect-1/1',
    'aspect-4/5 10 second',
  ]),
});

export const AssetsCardsDeepRef = z.object({
  Title: z.string(),
  Description: z.string(),
  Label: z.string(),
  Image: Media,
  CTA: nullish(z.lazy((): z.ZodType<LinksDeepRef> => LinksDeepRef)),
  File: nullish(Media),
  Display_Mode: z.enum([
    'aspect-16/9',
    'aspect-9/16',
    'aspect-4/5',
    'aspect-1/1',
    'aspect-4/5 10 second',
  ]),
});

export type AssetsCardsDeepRef = z.infer<typeof AssetsCardsDeepRef>;

export type AssetsCards = z.infer<typeof AssetsCards>;
