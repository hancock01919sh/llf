import { z } from 'zod';
import { PageRef } from '../api/page';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Cta = z.object({
  __component: z.literal('shared.cta'),
  id: z.number().int(),
  label: nullish(z.string()),
  href: nullish(z.string()),
  page: nullish(z.lazy(() => PageRef)),
});

export const CtaRef = z.object({
  __component: z.literal('shared.cta'),
  id: z.number().int(),
  label: nullish(z.string()),
  href: nullish(z.string()),
});

export type Cta = z.infer<typeof Cta>;
