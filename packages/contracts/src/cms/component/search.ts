import { z } from 'zod';
import { BlockSchema } from '../blocks';
import {LinksSchema } from '../shared/links';
import {TipsPopupSchema } from '../component/tips-popup';

export const SearchSchema = z.object({
  Title: z.string().optional(),
  Description: z.string().optional(),
  Placeholder: z.string().optional(),
  Statement: BlockSchema.array().optional(),
  Hint: z.string().optional(),
  Button: z.lazy((): z.ZodType => LinksSchema).optional(),
  Popup: z.lazy((): z.ZodType => TipsPopupSchema).optional(),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(["paper"]).optional(),
});

export type Search = z.infer<typeof SearchSchema>;
