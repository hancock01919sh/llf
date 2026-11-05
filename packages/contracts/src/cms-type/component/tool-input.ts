import { z } from 'zod';
import { InputCardRef, InputCardDeepRef } from '../shared/input-card';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolInput = z.object({
  __component: z.literal('component.tool-input'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  description: z.string(),
  cardTitle: z.string(),
  cardDescription: nullish(z.string()),
  cards: nullish(z.array(z.lazy(() => InputCardRef))),
  placeholder: nullish(z.string()),
  copy: nullish(z.string()),
  button: nullish(z.array(z.lazy(() => LinksRef))),
  backgroundColor: z.enum(['forest', 'paper']),
  isFullwidth: nullish(z.boolean().default(false)),
  image: nullish(Media),
});

export const ToolInputRef = z.object({
  __component: z.literal('component.tool-input'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  description: z.string(),
  cardTitle: z.string(),
  cardDescription: nullish(z.string()),
  placeholder: nullish(z.string()),
  copy: nullish(z.string()),
  backgroundColor: z.enum(['forest', 'paper']),
  isFullwidth: nullish(z.boolean().default(false)),
  image: nullish(Media),
});

export const ToolInputDeepRef = z.object({
  __component: z.literal('component.tool-input'),
  id: z.number().int(),
  title: z.string(),
  subTitle: z.string(),
  description: z.string(),
  cardTitle: z.string(),
  cardDescription: nullish(z.string()),
  cards: nullish(z.array(z.lazy((): z.ZodType<InputCardDeepRef> => InputCardDeepRef))),
  placeholder: nullish(z.string()),
  copy: nullish(z.string()),
  button: nullish(z.array(z.lazy((): z.ZodType<LinksDeepRef> => LinksDeepRef))),
  backgroundColor: z.enum(['forest', 'paper']),
  isFullwidth: nullish(z.boolean().default(false)),
  image: nullish(Media),
});

export type ToolInputDeepRef = z.infer<typeof ToolInputDeepRef>;

export type ToolInput = z.infer<typeof ToolInput>;
