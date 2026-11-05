import { z, ZodType } from 'zod';

export const Tool = z.object({
  url_label: z.string().default('Recipe URL'),
  url_placeholder: z.string().default('Enter URL'),
  upload_label: z.string().default('Image Upload'),
  upload_placeholder: z.string().default('Upload Image'),
  description: z
    .string()
    .default(
      'Explainer copy guiding user on how to upload a recipe to the tool and mentioning several popular sites the tool works with.',
    ),
  cta_label: z.string().default('Find my tips'),
});

export const ToolRef = z.object({
  url_label: z.string().default('Recipe URL'),
  url_placeholder: z.string().default('Enter URL'),
  upload_label: z.string().default('Image Upload'),
  upload_placeholder: z.string().default('Upload Image'),
  description: z
    .string()
    .default(
      'Explainer copy guiding user on how to upload a recipe to the tool and mentioning several popular sites the tool works with.',
    ),
  cta_label: z.string().default('Find my tips'),
});

export const ToolDeepRef = z.object({
  url_label: z.string().default('Recipe URL'),
  url_placeholder: z.string().default('Enter URL'),
  upload_label: z.string().default('Image Upload'),
  upload_placeholder: z.string().default('Upload Image'),
  description: z
    .string()
    .default(
      'Explainer copy guiding user on how to upload a recipe to the tool and mentioning several popular sites the tool works with.',
    ),
  cta_label: z.string().default('Find my tips'),
});

export type ToolDeepRef = z.infer<typeof ToolDeepRef>;

export type Tool = z.infer<typeof Tool>;
