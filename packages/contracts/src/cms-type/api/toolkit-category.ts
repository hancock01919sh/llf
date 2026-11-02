import { z } from 'zod';

const nullish = <T extends z.ZodType>(schema: T) => schema.nullish();

export const ToolkitCategory = z.object({
  id: z.number(),
  documentId: z.string(),
  label: nullish(z.string()),
  parentCategory: nullish(z.enum(['PSA Assets', 'Guideline'])),
  SubCategory_Description: nullish(z.string()),
});

export const ToolkitCategoryRef = z.object({
  id: z.number(),
  documentId: z.string(),
  label: nullish(z.string()),
  parentCategory: nullish(z.enum(['PSA Assets', 'Guideline'])),
  SubCategory_Description: nullish(z.string()),
});

export type ToolkitCategory = z.infer<typeof ToolkitCategory>;
