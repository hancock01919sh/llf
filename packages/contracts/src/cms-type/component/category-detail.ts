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
  Button: nullish(z.lazy(() => LinksRef)),
  Popup: nullish(z.lazy(() => TipsPopupRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['forest'])),
});

export const CategoryDetailRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Image: nullish(Media.array()),
  SubTitle: nullish(z.string()),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: nullish(z.enum(['forest'])),
});

export type CategoryDetail = z.infer<typeof CategoryDetail>;
