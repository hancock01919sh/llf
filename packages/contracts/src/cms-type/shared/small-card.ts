import { z } from 'zod';
import { CategoryRef, CategoryDeepRef } from '../api/category';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const SmallCard = z.object({
  category: nullish(z.lazy(() => CategoryRef)),
});

export const SmallCardRef = z.object({});

export const SmallCardDeepRef = z.object({
  category: nullish(z.lazy((): z.ZodType<CategoryDeepRef> => CategoryDeepRef)),
});

export type SmallCardDeepRef = z.infer<typeof SmallCardDeepRef>;

export type SmallCard = z.infer<typeof SmallCard>;

export type SmallCardRef = z.infer<typeof SmallCardRef>;
