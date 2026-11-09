import { z } from 'zod';
import { GuideRef, GuideDeepRef } from '../component/guide';
import { TitleRef, TitleDeepRef } from '../shared/title';

export const ToolkitParentCategory = z.object({
  id: z.number().int(),
  subCategory: z.array(z.lazy(() => GuideRef)),
  title: z.lazy(() => TitleRef),
});

export const ToolkitParentCategoryRef = z.object({
  id: z.number().int(),
});

export const ToolkitParentCategoryDeepRef = z.object({
  id: z.number().int(),
  subCategory: z.array(z.lazy((): z.ZodType<GuideDeepRef> => GuideDeepRef)),
  title: z.lazy((): z.ZodType<TitleDeepRef> => TitleDeepRef),
});

export type ToolkitParentCategoryDeepRef = z.infer<typeof ToolkitParentCategoryDeepRef>;

export type ToolkitParentCategory = z.infer<typeof ToolkitParentCategory>;

export type ToolkitParentCategoryRef = z.infer<typeof ToolkitParentCategoryRef>;
