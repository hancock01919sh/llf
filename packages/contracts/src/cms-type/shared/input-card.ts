import type { ZodType } from 'zod';
import { z } from 'zod';
import { LinksRef, LinksDeepRef } from '../shared/links';
import { Media } from '../media';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const InputCard = z.object({
  title: z.string(),
  icon: nullish(Media),
  link: nullish(z.lazy((): ZodType => LinksRef)),
  description: z.string(),
});

export const InputCardRef = z.object({
  title: z.string(),
  icon: nullish(Media),
  description: z.string(),
});

export const InputCardDeepRef = z.object({
  title: z.string(),
  icon: nullish(Media),
  link: nullish(z.lazy((): ZodType => LinksDeepRef)),
  description: z.string(),
});

export type InputCardDeepRef = z.infer<typeof InputCardDeepRef>;

export type InputCard = z.infer<typeof InputCard>;
