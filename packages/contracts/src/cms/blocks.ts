import { z } from 'zod';

export const BlockChildSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  code: z.boolean().optional(),
});

export const BlockSchema = z.object({
  type: z.string(),
  children: z.array(BlockChildSchema).optional(),
  level: z.number().optional(),
  format: z.string().optional(),
  url: z.string().optional(),
  text: z.string().optional(),
});

export type Block = z.infer<typeof BlockSchema>;
export type BlockChild = z.infer<typeof BlockChildSchema>;
