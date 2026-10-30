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
  Button: nullish(LinksRef),
  Popup: nullish(TipsPopupRef),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['paper']).optional(),
});

export const SearchRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Placeholder: nullish(z.string()),
  Hint: nullish(z.string()),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['paper']).optional(),
});

export type Search = z.infer<typeof Search>;
