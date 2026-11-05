import type { ZodType } from 'zod';
import { z } from 'zod';
import { PageRef, PageDeepRef } from '../api/page';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Cta = z.object({
  label: nullish(z.string()),
  href: nullish(z.string()),
  page: nullish(z.lazy((): ZodType => PageRef)),
});

export const CtaRef = z.object({
  label: nullish(z.string()),
  href: nullish(z.string()),
});

export const CtaDeepRef = z.object({
  label: nullish(z.string()),
  href: nullish(z.string()),
  page: nullish(z.lazy((): ZodType => PageDeepRef)),
});

export type CtaDeepRef = z.infer<typeof CtaDeepRef>;

export type Cta = z.infer<typeof Cta>;
