import { z } from 'zod';
import { InputCardRef } from '../shared/input-card';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolInput = z.object({
  __component: z.literal('component.tool-input'),
  id: z.number().int(),
  Title: z.string(),
  SubTitle: z.string(),
  Description: z.string(),
  Image: Media,
  CardTitle: z.string(),
  CardDescription: nullish(z.string()),
  Cards: nullish(z.array(z.lazy(() => InputCardRef))),
  Placeholder: nullish(z.string()),
  Copy: nullish(z.string()),
  Button: nullish(z.array(z.lazy(() => LinksRef))),
  Background_color: z.enum(['forest', 'paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const ToolInputRef = z.object({
  __component: z.literal('component.tool-input'),
  id: z.number().int(),
  Title: z.string(),
  SubTitle: z.string(),
  Description: z.string(),
  Image: Media,
  CardTitle: z.string(),
  CardDescription: nullish(z.string()),
  Placeholder: nullish(z.string()),
  Copy: nullish(z.string()),
  Background_color: z.enum(['forest', 'paper']),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type ToolInput = z.infer<typeof ToolInput>;
