import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { TitleRef, TitleDeepRef } from '../shared/title';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipsPopup = z.object({
  id: z.number().int(),
  description: nullish(z.string()),
  link: nullish(z.lazy(() => LinksRef)),
  title: z.lazy(() => TitleRef),
});

export const TipsPopupRef = z.object({
  id: z.number().int(),
  description: nullish(z.string()),
});

export const TipsPopupDeepRef = z.object({
  id: z.number().int(),
  description: nullish(z.string()),
  link: nullish(z.lazy((): z.ZodType<LinksDeepRef> => LinksDeepRef)),
  title: z.lazy((): z.ZodType<TitleDeepRef> => TitleDeepRef),
});

export type TipsPopupDeepRef = z.infer<typeof TipsPopupDeepRef>;

export type TipsPopup = z.infer<typeof TipsPopup>;

export type TipsPopupRef = z.infer<typeof TipsPopupRef>;
