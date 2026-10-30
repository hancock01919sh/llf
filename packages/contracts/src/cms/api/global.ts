import { z } from 'zod';
import { LoadingSchema } from '../component/loading';
import { SeoSchema } from '../shared/seo';

export const GlobalSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string().optional(),
  seo: z.lazy((): z.ZodType => SeoSchema).optional(),
  load: z.lazy((): z.ZodType => LoadingSchema).optional(),
});

export type Global = z.infer<typeof GlobalSchema>;
