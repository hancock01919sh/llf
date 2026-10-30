import { z } from 'zod';
import { PageSchema } from '../api/page';

export const CtaSchema = z.object({
  label: z.string().optional(),
  href: z.string().optional(),
  page: z.lazy((): z.ZodType => PageSchema).optional(),
});

export type Cta = z.infer<typeof CtaSchema>;
