import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const InputCard = z.object({
  Title: nullish(z.string()),
  Icon: nullish(Media),
  Link: nullish(LinksRef),
  Description: nullish(z.string()),
});

export const InputCardRef = z.object({
  Title: nullish(z.string()),
  Icon: nullish(Media),
  Description: nullish(z.string()),
});

export type InputCard = z.infer<typeof InputCard>;
