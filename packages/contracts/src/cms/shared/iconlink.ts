import { z } from 'zod';
import { MediaSchema } from '../media';

export const IconlinkSchema = z.object({
  Label: z.string().optional(),
  Image: MediaSchema.optional(),
  href: z.string().optional(),
});

export type Iconlink = z.infer<typeof IconlinkSchema>;
