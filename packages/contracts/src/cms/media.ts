import { z } from 'zod';

export const MediaSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  url: z.string(),
  alternativeText: z.string().optional(),
  caption: z.string().optional(),
  mime: z.string().optional(),
  name: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type Media = z.infer<typeof MediaSchema>;
