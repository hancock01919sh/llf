import { z } from 'zod';
import { Loading } from '../component/loading';
import { Seo } from '../shared/seo';

export const Global = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string().optional(),
  seo: z.lazy((): z.ZodType => Seo).optional(),
  load: z.lazy((): z.ZodType => Loading).optional(),
});

export type Global = z.infer<typeof Global>;
