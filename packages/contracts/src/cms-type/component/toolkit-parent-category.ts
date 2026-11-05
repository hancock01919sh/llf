import { z } from 'zod';
import { GuideRef, GuideDeepRef } from '../component/guide';

export const ToolkitParentCategory = z.object({
  __component: z.literal('component.toolkit-parent-category'),
  id: z.number().int(),
  Title: z.string(),
  SubCategory: z.array(z.lazy(() => GuideRef)),
});

export const ToolkitParentCategoryRef = z.object({
  __component: z.literal('component.toolkit-parent-category'),
  id: z.number().int(),
  Title: z.string(),
});

export const ToolkitParentCategoryDeepRef = z.object({
  __component: z.literal('component.toolkit-parent-category'),
  id: z.number().int(),
  Title: z.string(),
  SubCategory: z.array(z.lazy((): z.ZodType<GuideDeepRef> => GuideDeepRef)),
});

export type ToolkitParentCategoryDeepRef = z.infer<typeof ToolkitParentCategoryDeepRef>;

export type ToolkitParentCategory = z.infer<typeof ToolkitParentCategory>;
