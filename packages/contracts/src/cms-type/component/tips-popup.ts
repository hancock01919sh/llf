import { z } from 'zod';
import { LinksRef } from '../shared/links';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const TipsPopup = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
  Link: nullish(LinksRef),
});

export const TipsPopupRef = z.object({
  Title: nullish(z.string()),
  Description: nullish(z.string()),
});

export type TipsPopup = z.infer<typeof TipsPopup>;
