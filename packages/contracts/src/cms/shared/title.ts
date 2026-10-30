import { z } from 'zod';

export const TitleSchema = z.object({
  copy: z.string().optional(),
  header: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).default('h3'),
});

export type Title = z.infer<typeof TitleSchema>;
