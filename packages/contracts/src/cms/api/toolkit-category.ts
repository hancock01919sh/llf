import { z } from 'zod';

export const ToolkitCategorySchema = z.object({
  id: z.number(),
  documentId: z.string(),
  label: z.string().optional(),
  parentCategory: z.enum(["PSA Assets","Guideline"]).optional(),
  SubCategory_Description: z.string().optional(),
});

export type ToolkitCategory = z.infer<typeof ToolkitCategorySchema>;
