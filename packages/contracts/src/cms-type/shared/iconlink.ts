import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Iconlink = z.object({
  label: z.string(),
  href: nullish(z.string()),
});

export const IconlinkRef = z.object({
  label: z.string(),
  href: nullish(z.string()),
});

export const IconlinkDeepRef = z.object({
  label: z.string(),
  href: nullish(z.string()),
});

export type IconlinkDeepRef = z.infer<typeof IconlinkDeepRef>;

export type Iconlink = z.infer<typeof Iconlink>;
