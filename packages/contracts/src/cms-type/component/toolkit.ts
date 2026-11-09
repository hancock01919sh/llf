import { z } from 'zod';
import {
  ToolkitParentCategoryRef,
  ToolkitParentCategoryDeepRef,
} from '../component/toolkit-parent-category';

export const Toolkit = z.object({
  __component: z.literal('component.toolkit'),
  id: z.number().int(),
  title: z.string(),
  toolkitCategory: z.array(z.lazy(() => ToolkitParentCategoryRef)),
});

export const ToolkitRef = z.object({
  __component: z.literal('component.toolkit'),
  id: z.number().int(),
  title: z.string(),
});

export const ToolkitDeepRef = z.object({
  __component: z.literal('component.toolkit'),
  id: z.number().int(),
  title: z.string(),
  toolkitCategory: z.array(
    z.lazy((): z.ZodType<ToolkitParentCategoryDeepRef> => ToolkitParentCategoryDeepRef),
  ),
});

export type ToolkitDeepRef = z.infer<typeof ToolkitDeepRef>;

export type Toolkit = z.infer<typeof Toolkit>;

export type ToolkitRef = z.infer<typeof ToolkitRef>;
