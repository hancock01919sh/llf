import { z } from 'zod';
import { Media } from '../media';

export const Iconlink = z.object({
  Label: z.string().optional(),
  Image: Media.optional(),
  href: z.string().optional(),
});

export type Iconlink = z.infer<typeof Iconlink>;
