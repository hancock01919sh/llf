import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef } from '../shared/links';
import { Media } from '../media';
import { TipsPopupRef } from '../component/tips-popup';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryDetail = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media.array()),
  SubTitle: nullish(z.string()),
  Statement: nullish(Block.array()),
  Button: nullish(LinksRef),
  Popup: nullish(TipsPopupRef),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export const CategoryDetailRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media.array()),
  SubTitle: nullish(z.string()),
  isFullwidth: z.boolean().default(false).optional(),
  Background_color: z.enum(['forest']).optional(),
});

export type CategoryDetail = z.infer<typeof CategoryDetail>;
