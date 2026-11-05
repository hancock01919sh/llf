import type { ZodType } from 'zod';
import { z } from 'zod';
import {
  ToolkitParentCategoryRef,
  ToolkitParentCategoryDeepRef,
} from '../component/toolkit-parent-category';

export const Toolkit = z.object({
  __component: z.literal('component.toolkit'),
  id: z.number().int(),
  Title: z.string(),
  toolkitCategory: z.array(z.lazy((): ZodType => ToolkitParentCategoryRef)),
});

export const ToolkitRef = z.object({
  __component: z.literal('component.toolkit'),
  id: z.number().int(),
  Title: z.string(),
});

export const ToolkitDeepRef = z.object({
  __component: z.literal('component.toolkit'),
  id: z.number().int(),
  Title: z.string(),
  toolkitCategory: z.array(z.lazy((): ZodType => ToolkitParentCategoryDeepRef)),
});

export type ToolkitDeepRef = z.infer<typeof ToolkitDeepRef>;

export type Toolkit = z.infer<typeof Toolkit>;
