import { z } from 'zod';
import { LinksRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const InputCard = z.object({
  __component: z.literal('shared.input-card'),
  id: z.number().int(),
  Title: z.string(),
  Icon: nullish(Media),
  Link: nullish(z.lazy(() => LinksRef)),
  Description: z.string(),
});

export const InputCardRef = z.object({
  __component: z.literal('shared.input-card'),
  id: z.number().int(),
  Title: z.string(),
  Icon: nullish(Media),
  Description: z.string(),
});

export type InputCard = z.infer<typeof InputCard>;
