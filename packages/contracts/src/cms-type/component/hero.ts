import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Hero = z.object({
  __component: z.literal('component.hero'),
  id: z.number().int(),
  images: Media.array(),
  Link: nullish(z.array(z.lazy(() => LinksRef))),
  Description: z.string(),
  Title: Block.array(),
  Background_color: z.enum(['terra']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const HeroRef = z.object({
  __component: z.literal('component.hero'),
  id: z.number().int(),
  images: Media.array(),
  Description: z.string(),
  Background_color: z.enum(['terra']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type Hero = z.infer<typeof Hero>;
