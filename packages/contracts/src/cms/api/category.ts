import { z } from 'zod';
import { MediaSchema } from '../media';
import { GroupSchema } from '../api/group';
import { IngredientSchema } from '../api/ingredient';
import { SeoSchema } from '../shared/seo';
import { TipSchema } from '../api/tip';

export const CategorySchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  ingredients: z
    .lazy((): z.ZodType => IngredientSchema)
    .array()
    .optional(),
  tips: z
    .lazy((): z.ZodType => TipSchema)
    .array()
    .optional(),
  mode: z.enum(['Ingredients', 'Tips']).default('Ingredients'),
  image: MediaSchema.optional(),
  group: z.lazy((): z.ZodType => GroupSchema).optional(),
  seo: z.lazy((): z.ZodType => SeoSchema).optional(),
});

export type Category = z.infer<typeof CategorySchema>;
