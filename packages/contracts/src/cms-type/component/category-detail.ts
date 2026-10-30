import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef } from '../shared/links';
import { Media } from '../media';
import { TipsPopupRef } from '../component/tips-popup';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryDetail = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: Media.array().optional(),
  SubTitle: nullish(z.string()),
  Statement: Block.array().optional(),
  Button: LinksRef.optional(),
  Popup: TipsPopupRef.optional(),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export const CategoryDetailRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: Media.array().optional(),
  SubTitle: nullish(z.string()),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export type CategoryDetail = z.infer<typeof CategoryDetail>;
