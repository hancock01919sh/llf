import { z, ZodType } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Links = z.object({
  label: z.string(),
  href: nullish(z.string()),
  isDisplay: nullish(z.boolean().default(true)),
  isButton: nullish(z.boolean()),
  buttonType: nullish(z.enum(['Primary', 'Secondary'])),
  newTab: nullish(z.boolean().default(false)),
});

export const LinksRef = z.object({
  label: z.string(),
  href: nullish(z.string()),
  isDisplay: nullish(z.boolean().default(true)),
  isButton: nullish(z.boolean()),
  buttonType: nullish(z.enum(['Primary', 'Secondary'])),
  newTab: nullish(z.boolean().default(false)),
});

export const LinksDeepRef = z.object({
  label: z.string(),
  href: nullish(z.string()),
  isDisplay: nullish(z.boolean().default(true)),
  isButton: nullish(z.boolean()),
  buttonType: nullish(z.enum(['Primary', 'Secondary'])),
  newTab: nullish(z.boolean().default(false)),
});

export type LinksDeepRef = z.infer<typeof LinksDeepRef>;

export type Links = z.infer<typeof Links>;
