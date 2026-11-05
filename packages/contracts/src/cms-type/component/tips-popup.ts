import type { ZodType } from 'zod';
import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipsPopup = z.object({
  title: z.string(),
  description: nullish(z.string()),
  link: nullish(z.lazy((): ZodType => LinksRef)),
});

export const TipsPopupRef = z.object({
  title: z.string(),
  description: nullish(z.string()),
});

export const TipsPopupDeepRef = z.object({
  title: z.string(),
  description: nullish(z.string()),
  link: nullish(z.lazy((): ZodType => LinksDeepRef)),
});

export type TipsPopupDeepRef = z.infer<typeof TipsPopupDeepRef>;

export type TipsPopup = z.infer<typeof TipsPopup>;
