import { z } from 'zod';
import { MediaSchema } from '../media';
import {InputCardSchema } from '../shared/input-card';
import {LinksSchema } from '../shared/links';

export const ToolInputSchema = z.object({
  Title: z.string().optional(),
  SubTitle: z.string().optional(),
  Description: z.string().optional(),
  Image: MediaSchema.optional(),
  CardTitle: z.string().optional(),
  CardDescription: z.string().optional(),
  Cards: z.lazy((): z.ZodType => InputCardSchema).array().optional(),
  Placeholder: z.string().optional(),
  Copy: z.string().optional(),
  Button: z.lazy((): z.ZodType => LinksSchema).array().optional(),
  Background_color: z.enum(["forest","paper"]).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type ToolInput = z.infer<typeof ToolInputSchema>;
