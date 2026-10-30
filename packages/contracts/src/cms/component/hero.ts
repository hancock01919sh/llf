import { z } from 'zod';
import { BlockSchema } from '../blocks';
import { MediaSchema } from '../media';
import { LinksSchema } from '../shared/links';

export const HeroSchema = z.object({
  images: MediaSchema.array().optional(),
  Link: z
    .lazy((): z.ZodType => LinksSchema)
    .array()
    .optional(),
  Description: z.string().optional(),
  Title: BlockSchema.array().optional(),
  Background_color: z.enum(['terra']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type Hero = z.infer<typeof HeroSchema>;
