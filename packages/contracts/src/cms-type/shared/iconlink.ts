import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Iconlink = z.object({
  Label: nullish(z.string()),
  Image: Media.optional(),
  href: nullish(z.string()),
});

export const IconlinkRef = z.object({
  Label: nullish(z.string()),
  Image: Media.optional(),
  href: nullish(z.string()),
});

export type Iconlink = z.infer<typeof Iconlink>;
