import { z } from 'zod';
import { Media } from '../media';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const LogoCards = z.object({
  __component: z.literal('component.logo-cards'),
  id: z.number().int(),
  description: z.string(),
  imageDesktop: nullish(Media.array()),
  backgroundColor: z.enum(['paper', 'forest']),
  imageMobile: nullish(Media.array()),
  isFullwidth: nullish(z.boolean().default(false)),
  title: z.lazy(() => TitleRef),
});

export const LogoCardsRef = z.object({
  __component: z.literal('component.logo-cards'),
  id: z.number().int(),
  description: z.string(),
  imageDesktop: nullish(Media.array()),
  backgroundColor: z.enum(['paper', 'forest']),
  imageMobile: nullish(Media.array()),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const LogoCardsDeepRef = z.object({
  __component: z.literal('component.logo-cards'),
  id: z.number().int(),
  description: z.string(),
  imageDesktop: nullish(Media.array()),
  backgroundColor: z.enum(['paper', 'forest']),
  imageMobile: nullish(Media.array()),
  isFullwidth: nullish(z.boolean().default(false)),
  title: z.lazy((): z.ZodType<TitleDeepRef>  => TitleDeepRef),
});

export type LogoCardsDeepRef = z.infer<typeof LogoCardsDeepRef>;

export type LogoCards = z.infer<typeof LogoCards>;

export type LogoCardsRef = z.infer<typeof LogoCardsRef>;
