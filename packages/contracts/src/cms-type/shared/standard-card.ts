import { z } from 'zod';
import { CategoryRef, CategoryDeepRef } from '../api/category';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const StandardCard = z.object({
  category: nullish(z.lazy(() => CategoryRef)),
});

export const StandardCardRef = z.object({});

export const StandardCardDeepRef = z.object({
  category: nullish(z.lazy((): z.ZodType<CategoryDeepRef> => CategoryDeepRef)),
});

export type StandardCardDeepRef = z.infer<typeof StandardCardDeepRef>;

export type StandardCard = z.infer<typeof StandardCard>;

export type StandardCardRef = z.infer<typeof StandardCardRef>;
