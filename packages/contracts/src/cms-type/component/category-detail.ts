import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { Media } from '../media';
import { TipsPopupRef, TipsPopupDeepRef } from '../component/tips-popup';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryDetail = z.object({
  __component: z.literal('component.category-detail'),
  id: z.number().int(),
  description: nullish(z.string()),
  image: nullish(Media.array()),
  subTitle: nullish(z.string()),
  statement: nullish(Block.array()),
  button: nullish(z.lazy(() => LinksRef)),
  popup: nullish(z.lazy(() => TipsPopupRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
  hint: nullish(z.string()),
  title: nullish(z.lazy(() => TitleRef)),
});

export const CategoryDetailRef = z.object({
  __component: z.literal('component.category-detail'),
  id: z.number().int(),
  description: nullish(z.string()),
  image: nullish(Media.array()),
  subTitle: nullish(z.string()),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
  hint: nullish(z.string()),
});

export const CategoryDetailDeepRef = z.object({
  __component: z.literal('component.category-detail'),
  id: z.number().int(),
  description: nullish(z.string()),
  image: nullish(Media.array()),
  subTitle: nullish(z.string()),
  statement: nullish(Block.array()),
  button: nullish(z.lazy((): z.ZodType<LinksDeepRef>  => LinksDeepRef)),
  popup: nullish(z.lazy((): z.ZodType<TipsPopupDeepRef>  => TipsPopupDeepRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
  hint: nullish(z.string()),
  title: nullish(z.lazy((): z.ZodType<TitleDeepRef>  => TitleDeepRef)),
});

export type CategoryDetailDeepRef = z.infer<typeof CategoryDetailDeepRef>;

export type CategoryDetail = z.infer<typeof CategoryDetail>;

export type CategoryDetailRef = z.infer<typeof CategoryDetailRef>;
