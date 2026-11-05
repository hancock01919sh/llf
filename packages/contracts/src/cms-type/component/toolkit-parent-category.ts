import { z } from 'zod';
import { GuideRef, GuideDeepRef } from '../component/guide';

export const ToolkitParentCategory = z.object({
  id: z.number().int(),
  title: z.string(),
  subCategory: z.array(z.lazy(() => GuideRef)),
});

export const ToolkitParentCategoryRef = z.object({
  id: z.number().int(),
  title: z.string(),
});

export const ToolkitParentCategoryDeepRef = z.object({
  id: z.number().int(),
  title: z.string(),
  subCategory: z.array(z.lazy((): z.ZodType<GuideDeepRef> => GuideDeepRef)),
});

export type ToolkitParentCategoryDeepRef = z.infer<typeof ToolkitParentCategoryDeepRef>;

export type ToolkitParentCategory = z.infer<typeof ToolkitParentCategory>;

export type ToolkitParentCategoryRef = z.infer<typeof ToolkitParentCategoryRef>;
