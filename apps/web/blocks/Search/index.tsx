import type { cmsType } from '@llf/contracts';
import type { z } from 'zod';
export interface TIngredient extends Omit<cmsType.api.Ingredient, 'tips'> {
  tips: z.infer<typeof cmsType.api.Tip>;
}
export interface TCategoryDetail extends cmsType.api.Category {
  ingredients: TIngredient[];
}
export { BlockSearch } from './SearchBlock';
