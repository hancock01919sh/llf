import { z } from 'zod';

export const LogoItem = z.object({
  __component: z.literal('shared.logo-item'),
  id: z.number().int(),
});

export const LogoItemRef = z.object({
  __component: z.literal('shared.logo-item'),
  id: z.number().int(),
});

export type LogoItem = z.infer<typeof LogoItem>;
