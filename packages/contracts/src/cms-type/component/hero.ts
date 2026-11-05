import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Hero = z.object({
  __component: z.literal('component.hero'),
  id: z.number().int(),
  images: Media.array(),
  link: nullish(z.array(z.lazy(() => LinksRef))),
  description: z.string(),
  title: Block.array(),
  backgroundColor: z.enum(['terra']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const HeroRef = z.object({
  __component: z.literal('component.hero'),
  id: z.number().int(),
  images: Media.array(),
  description: z.string(),
  backgroundColor: z.enum(['terra']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const HeroDeepRef = z.object({
  __component: z.literal('component.hero'),
  id: z.number().int(),
  images: Media.array(),
  link: nullish(z.array(z.lazy((): z.ZodType<LinksDeepRef> => LinksDeepRef))),
  description: z.string(),
  title: Block.array(),
  backgroundColor: z.enum(['terra']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type HeroDeepRef = z.infer<typeof HeroDeepRef>;

export type Hero = z.infer<typeof Hero>;

export type HeroRef = z.infer<typeof HeroRef>;
