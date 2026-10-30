import { z } from 'zod';

export const Links = z.object({
  Label: z.string().optional(),
  href: z.string().optional(),
  isDisplay: z.boolean().default(true).optional(),
  isButton: z.boolean().optional(),
  Buttontype: z.enum(['Primary', 'Secondary']).optional(),
  NewTab: z.boolean().default(false).optional(),
});

export type Links = z.infer<typeof Links>;
