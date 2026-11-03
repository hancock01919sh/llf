import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Links = z.object({
  __component: z.literal('shared.links'),
  id: z.number().int(),
  Label: z.string(),
  href: nullish(z.string()),
  isDisplay: nullish(z.boolean().default(true)),
  isButton: nullish(z.boolean()),
  Buttontype: nullish(z.enum(['Primary', 'Secondary'])),
  NewTab: nullish(z.boolean().default(false)),
});

export const LinksRef = z.object({
  __component: z.literal('shared.links'),
  id: z.number().int(),
  Label: z.string(),
  href: nullish(z.string()),
  isDisplay: nullish(z.boolean().default(true)),
  isButton: nullish(z.boolean()),
  Buttontype: nullish(z.enum(['Primary', 'Secondary'])),
  NewTab: nullish(z.boolean().default(false)),
});

export type Links = z.infer<typeof Links>;
