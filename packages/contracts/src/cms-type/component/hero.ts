import { z } from 'zod';
import { Block } from '../blocks';
import { Links } from '../shared/links';
import { Media } from '../media';

export const Hero = z.object({
  images: Media.array().optional(),
  Link: z
    .lazy((): z.ZodType => Links)
    .array()
    .optional(),
  Description: z.string().optional(),
  Title: Block.array().optional(),
  Background_color: z.enum(['terra']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type Hero = z.infer<typeof Hero>;
