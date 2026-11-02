import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const _404 = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['forest'])),
});

export const _404Ref = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['forest'])),
});

export type _404 = z.infer<typeof _404>;
