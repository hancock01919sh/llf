import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef } from '../shared/links';
import { TipsPopupRef } from '../component/tips-popup';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Search = z.object({
  __component: z.literal('component.search'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Placeholder: z.string(),
  Statement: Block.array(),
  Hint: z.string(),
  Button: nullish(z.lazy(() => LinksRef)),
  Popup: z.lazy(() => TipsPopupRef),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['paper'])),
});

export const SearchRef = z.object({
  __component: z.literal('component.search'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Placeholder: z.string(),
  Hint: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['paper'])),
});

export type Search = z.infer<typeof Search>;
