import { z } from 'zod';

export const BlockChild = z.object({
  type: z.string(),
  text: z.string().optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  code: z.boolean().optional(),
});

export const Block = z.object({
  type: z.string(),
  children: z.array(BlockChild).optional(),
  level: z.number().optional(),
  format: z.string().optional(),
  url: z.string().optional(),
  text: z.string().optional(),
});

export type Block = z.infer<typeof Block>;
export type BlockChild = z.infer<typeof BlockChild>;
