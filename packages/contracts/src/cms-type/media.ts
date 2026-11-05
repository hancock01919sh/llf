import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Media = z.object({
  id: z.number().int(),
  documentId: z.string().min(1),
  url: z.string().min(1),
  alternativeText: nullish(z.string()),
  caption: nullish(z.string()),
  width: nullish(z.number()),
  height: nullish(z.number()),
  mime: nullish(z.string()),
  name: nullish(z.string()),
});

export type Media = z.infer<typeof Media>;
