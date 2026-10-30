import { z } from 'zod';

export const _404Schema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export type _404 = z.infer<typeof _404Schema>;
