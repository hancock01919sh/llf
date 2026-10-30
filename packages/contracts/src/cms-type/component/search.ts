import { z } from 'zod';
import { Block } from '../blocks';
import { Links } from '../shared/links';
import { TipsPopup } from '../component/tips-popup';

export const Search = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Placeholder: z.string().optional(),
  Statement: Block.array().optional(),
  Hint: z.string().optional(),
  Button: z.lazy((): z.ZodType => Links).optional(),
  Popup: z.lazy((): z.ZodType => TipsPopup).optional(),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['paper']).optional(),
});

export type Search = z.infer<typeof Search>;
