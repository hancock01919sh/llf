import { z } from 'zod';
import { InputCardRef } from '../shared/input-card';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolInput = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Description: nullish(z.string()),
  Image: Media.optional(),
  CardTitle: nullish(z.string()),
  CardDescription: nullish(z.string()),
  Cards: InputCardRef.array().optional(),
  Placeholder: nullish(z.string()),
  Copy: nullish(z.string()),
  Button: LinksRef.array().optional(),
  Background_color: z.enum(['forest', 'paper']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export const ToolInputRef = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Description: nullish(z.string()),
  Image: Media.optional(),
  CardTitle: nullish(z.string()),
  CardDescription: nullish(z.string()),
  Placeholder: nullish(z.string()),
  Copy: nullish(z.string()),
  Background_color: z.enum(['forest', 'paper']).optional(),
  isFullwidth: z.boolean().default(false).optional(),
});

export type ToolInput = z.infer<typeof ToolInput>;
