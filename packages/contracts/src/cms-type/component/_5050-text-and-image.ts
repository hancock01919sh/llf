import { z } from 'zod';
import { Media } from '../media';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const _5050TextAndImage = z.object({
  __component: z.literal('component.5050-text-and-image'),
  id: z.number().int(),
  description: z.string(),
  image: Media,
  makeImageLeft: nullish(z.boolean()),
  addBackgroundColor: nullish(z.boolean().default(false)),
  positionOfAddingBgColor: nullish(z.enum(['Up ', 'Down'])),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['paper', 'forest']),
  title: z.lazy(() => TitleRef),
});

export const _5050TextAndImageRef = z.object({
  __component: z.literal('component.5050-text-and-image'),
  id: z.number().int(),
  description: z.string(),
  image: Media,
  makeImageLeft: nullish(z.boolean()),
  addBackgroundColor: nullish(z.boolean().default(false)),
  positionOfAddingBgColor: nullish(z.enum(['Up ', 'Down'])),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['paper', 'forest']),
});

export const _5050TextAndImageDeepRef = z.object({
  __component: z.literal('component.5050-text-and-image'),
  id: z.number().int(),
  description: z.string(),
  image: Media,
  makeImageLeft: nullish(z.boolean()),
  addBackgroundColor: nullish(z.boolean().default(false)),
  positionOfAddingBgColor: nullish(z.enum(['Up ', 'Down'])),
  isFullwidth: nullish(z.boolean().default(false)),
  backgroundColor: z.enum(['paper', 'forest']),
  title: z.lazy((): z.ZodType<TitleDeepRef> => TitleDeepRef),
});

export type _5050TextAndImageDeepRef = z.infer<typeof _5050TextAndImageDeepRef>;

export type _5050TextAndImage = z.infer<typeof _5050TextAndImage>;

export type _5050TextAndImageRef = z.infer<typeof _5050TextAndImageRef>;
