import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const _404 = z.object({
  __component: z.literal('component.404'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
});

export const _404Ref = z.object({
  __component: z.literal('component.404'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
});

export type _404 = z.infer<typeof _404>;
