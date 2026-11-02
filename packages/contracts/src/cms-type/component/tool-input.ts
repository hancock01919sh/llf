import { z } from 'zod';
import { InputCardRef } from '../shared/input-card';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolInput = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  CardTitle: nullish(z.string()),
  CardDescription: nullish(z.string()),
  Cards: nullish(z.array(z.lazy(() => InputCardRef))),
  Placeholder: nullish(z.string()),
  Copy: nullish(z.string()),
  Button: nullish(z.array(z.lazy(() => LinksRef))),
  Background_color: nullish(z.enum(['forest', 'paper'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export const ToolInputRef = z.object({
  Title: nullish(z.string()),
  SubTitle: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media),
  CardTitle: nullish(z.string()),
  CardDescription: nullish(z.string()),
  Placeholder: nullish(z.string()),
  Copy: nullish(z.string()),
  Background_color: nullish(z.enum(['forest', 'paper'])),
  isFullwidth: nullish(z.boolean().default(false)),
});

export type ToolInput = z.infer<typeof ToolInput>;
