import type { ZodType } from 'zod';
import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { TipsPopupRef, TipsPopupDeepRef } from '../component/tips-popup';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Search = z.object({
  __component: z.literal('component.search'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  placeholder: z.string(),
  statement: Block.array(),
  hint: z.string(),
  button: nullish(z.lazy((): ZodType => LinksRef)),
  popup: nullish(z.lazy((): ZodType => TipsPopupRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: nullish(z.enum(['paper'])),
});

export const SearchRef = z.object({
  __component: z.literal('component.search'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  placeholder: z.string(),
  hint: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: nullish(z.enum(['paper'])),
});

export const SearchDeepRef = z.object({
  __component: z.literal('component.search'),
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  placeholder: z.string(),
  statement: Block.array(),
  hint: z.string(),
  button: nullish(z.lazy((): ZodType => LinksDeepRef)),
  popup: nullish(z.lazy((): ZodType => TipsPopupDeepRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: nullish(z.enum(['paper'])),
});

export type SearchDeepRef = z.infer<typeof SearchDeepRef>;

export type Search = z.infer<typeof Search>;
