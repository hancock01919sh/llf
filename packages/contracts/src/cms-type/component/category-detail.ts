import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef } from '../shared/links';
import { Media } from '../media';
import { TipsPopupRef } from '../component/tips-popup';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryDetail = z.object({
  __component: z.literal('component.category-detail'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Image: Media.array(),
  SubTitle: z.string(),
  Statement: nullish(Block.array()),
  Button: nullish(z.lazy(() => LinksRef)),
  Popup: nullish(z.lazy(() => TipsPopupRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: z.enum(['forest']),
});

export const CategoryDetailRef = z.object({
  __component: z.literal('component.category-detail'),
  id: z.number().int(),
  Title: z.string(),
  Description: z.string(),
  Image: Media.array(),
  SubTitle: z.string(),
  isFullwidth: nullish(z.boolean().default(false)),
  Background_color: z.enum(['forest']),
});

export type CategoryDetail = z.infer<typeof CategoryDetail>;
