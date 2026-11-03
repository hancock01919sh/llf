import { cmsType } from '@llf/contracts';
import type { z } from 'zod';
export const SearchSchema = cmsType.component.Search.extend({
  Popup: cmsType.component.TipsPopup.nullish(),
});
export type SearchBlockProps = z.infer<typeof SearchSchema>;
export interface TIngredient extends Omit<cmsType.api.Ingredient, 'tips'> {
  tips: z.infer<typeof cmsType.api.Tip>;
}
export interface TCategoryDetail extends cmsType.api.Category {
  ingredients: TIngredient[];
}
export { SearchBlock } from './SearchBlock';
