import { z } from 'zod';

export const LoadingSchema = z.object({
  Title: z.string().optional(),
  Statement: z.string().optional(),
  Background_color: z.enum(['forest']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type Loading = z.infer<typeof LoadingSchema>;
