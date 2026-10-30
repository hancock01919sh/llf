import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Hero = z.object({
  images: Media.array().optional(),
  Link: LinksRef.array().optional(),
  Description: nullish(z.string()),
  Title: Block.array().optional(),
  Background_color: z.enum(['terra']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export const HeroRef = z.object({
  images: Media.array().optional(),
  Description: nullish(z.string()),
  Background_color: z.enum(['terra']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type Hero = z.infer<typeof Hero>;
