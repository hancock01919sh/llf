import { z } from 'zod';
import { InputCard } from '../shared/input-card';
import { Links } from '../shared/links';
import { Media } from '../media';

export const ToolInput = z.object({
  Title: z.string().optional(),
  SubTitle: z.string().optional(),
  Description: z.string().optional(),
  Image: Media.optional(),
  CardTitle: z.string().optional(),
  CardDescription: z.string().optional(),
  Cards: z
    .lazy((): z.ZodType => InputCard)
    .array()
    .optional(),
  Placeholder: z.string().optional(),
  Copy: z.string().optional(),
  Button: z
    .lazy((): z.ZodType => Links)
    .array()
    .optional(),
  Background_color: z.enum(['forest', 'paper']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type ToolInput = z.infer<typeof ToolInput>;
