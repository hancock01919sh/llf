import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Links = z.object({
  Label: nullish(z.string()),
  href: nullish(z.string()),
  isDisplay: z.boolean().default(true).optional(),
  isButton: z.boolean().optional(),
  Buttontype: z.enum(['Primary', 'Secondary']).optional(),
  NewTab: z.boolean().default(false).optional(),
});

export const LinksRef = z.object({
  Label: nullish(z.string()),
  href: nullish(z.string()),
  isDisplay: z.boolean().default(true).optional(),
  isButton: z.boolean().optional(),
  Buttontype: z.enum(['Primary', 'Secondary']).optional(),
  NewTab: z.boolean().default(false).optional(),
});

export type Links = z.infer<typeof Links>;
