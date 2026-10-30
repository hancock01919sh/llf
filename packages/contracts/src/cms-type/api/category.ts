import { z } from 'zod';
import { Group } from '../api/group';
import { Ingredient } from '../api/ingredient';
import { Media } from '../media';
import { Seo } from '../shared/seo';
import { Tip } from '../api/tip';

export const Category = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  ingredients: z
    .lazy((): z.ZodType => Ingredient)
    .array()
    .optional(),
  tips: z
    .lazy((): z.ZodType => Tip)
    .array()
    .optional(),
  mode: z.enum(['Ingredients', 'Tips']).default('Ingredients'),
  image: Media.optional(),
  group: z.lazy((): z.ZodType => Group).optional(),
  seo: z.lazy((): z.ZodType => Seo).optional(),
});

export type Category = z.infer<typeof Category>;
