import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef } from '../shared/links';
import { TipsPopupRef } from '../component/tips-popup';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const Search = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Placeholder: nullish(z.string()),
  Statement: nullish(Block.array()),
  Hint: nullish(z.string()),
  Button: nullish(z.lazy(() => LinksRef)),
  Popup: nullish(z.lazy(() => TipsPopupRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['paper'])),
});

export const SearchRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Placeholder: nullish(z.string()),
  Hint: nullish(z.string()),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['paper'])),
});

export type Search = z.infer<typeof Search>;
