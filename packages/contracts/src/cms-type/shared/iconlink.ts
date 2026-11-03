import { z } from 'zod';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Iconlink = z.object({
  __component: z.literal('shared.iconlink'),
  id: z.number().int(),
  Label: z.string(),
  Image: Media,
  href: nullish(z.string()),
});

export const IconlinkRef = z.object({
  __component: z.literal('shared.iconlink'),
  id: z.number().int(),
  Label: z.string(),
  Image: Media,
  href: nullish(z.string()),
});

export type Iconlink = z.infer<typeof Iconlink>;
