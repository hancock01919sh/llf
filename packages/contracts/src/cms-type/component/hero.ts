import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Hero = z.object({
  images: nullish(Media.array()),
  Link: nullish(z.array(z.lazy(() => LinksRef))),
  Description: nullish(z.string()),
  Title: nullish(Block.array()),
  Background_color: nullish(z.enum(['terra'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const HeroRef = z.object({
  images: nullish(Media.array()),
  Description: nullish(z.string()),
  Background_color: nullish(z.enum(['terra'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type Hero = z.infer<typeof Hero>;
