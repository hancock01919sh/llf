import { z } from 'zod';
import { Page } from '../api/page';

export const Cta = z.object({
  label: z.string().optional(),
  href: z.string().optional(),
  page: z.lazy((): z.ZodType => Page).optional(),
});

export type Cta = z.infer<typeof Cta>;
