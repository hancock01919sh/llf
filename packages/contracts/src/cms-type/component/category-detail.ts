import type { ZodType } from 'zod';
import { z } from 'zod';
import { Block } from '../blocks';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { Media } from '../media';
import { TipsPopupRef, TipsPopupDeepRef } from '../component/tips-popup';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const CategoryDetail = z.object({
  __component: z.literal('component.category-detail'),
  id: z.number().int(),
  title: nullish(z.string()),
  description: nullish(z.string()),
  image: nullish(Media.array()),
  subTitle: nullish(z.string()),
  statement: nullish(Block.array()),
  button: nullish(z.lazy((): ZodType => LinksRef)),
  popup: nullish(z.lazy((): ZodType => TipsPopupRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
});

export const CategoryDetailRef = z.object({
  __component: z.literal('component.category-detail'),
  id: z.number().int(),
  title: nullish(z.string()),
  description: nullish(z.string()),
  image: nullish(Media.array()),
  subTitle: nullish(z.string()),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
});

export const CategoryDetailDeepRef = z.object({
  __component: z.literal('component.category-detail'),
  id: z.number().int(),
  title: nullish(z.string()),
  description: nullish(z.string()),
  image: nullish(Media.array()),
  subTitle: nullish(z.string()),
  statement: nullish(Block.array()),
  button: nullish(z.lazy((): ZodType => LinksDeepRef)),
  popup: nullish(z.lazy((): ZodType => TipsPopupDeepRef)),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['forest']),
});

export type CategoryDetailDeepRef = z.infer<typeof CategoryDetailDeepRef>;

export type CategoryDetail = z.infer<typeof CategoryDetail>;
