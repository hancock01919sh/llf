import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { TipsPopupRef, TipsPopupDeepRef } from '../component/tips-popup';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Search = z.object({
  __component: z.literal('component.search'),
  id: z.number().int(),
  description: z.string(),
  placeholder: z.string(),
  statement: Block.array(),
  hint: z.string(),
  button: nullish(z.lazy(() => LinksRef)),
  popup: nullish(z.lazy(() => TipsPopupRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: nullish(z.enum(['paper'])),
  title: z.lazy(() => TitleRef),
});

export const SearchRef = z.object({
  __component: z.literal('component.search'),
  id: z.number().int(),
  description: z.string(),
  placeholder: z.string(),
  hint: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: nullish(z.enum(['paper'])),
});

export const SearchDeepRef = z.object({
  __component: z.literal('component.search'),
  id: z.number().int(),
  description: z.string(),
  placeholder: z.string(),
  statement: Block.array(),
  hint: z.string(),
  button: nullish(z.lazy((): z.ZodType<LinksDeepRef>  => LinksDeepRef)),
  popup: nullish(z.lazy((): z.ZodType<TipsPopupDeepRef>  => TipsPopupDeepRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: nullish(z.enum(['paper'])),
  title: z.lazy((): z.ZodType<TitleDeepRef>  => TitleDeepRef),
});

export type SearchDeepRef = z.infer<typeof SearchDeepRef>;

export type Search = z.infer<typeof Search>;

export type SearchRef = z.infer<typeof SearchRef>;
