import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const _404 = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export const _404Ref = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export type _404 = z.infer<typeof _404>;
