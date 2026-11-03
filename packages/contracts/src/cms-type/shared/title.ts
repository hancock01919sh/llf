import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Title = z.object({
  __component: z.literal('shared.title'),
  id: z.number().int(),
  copy: nullish(z.string()),
  header: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).default('h3'),
});

export const TitleRef = z.object({
  __component: z.literal('shared.title'),
  id: z.number().int(),
  copy: nullish(z.string()),
  header: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).default('h3'),
});

export type Title = z.infer<typeof Title>;
