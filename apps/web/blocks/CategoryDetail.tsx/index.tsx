import type { z } from 'zod';
import { type BlockProps } from '../types';
import { IngredientsHeader } from './IngredientsHeader';
import { IngredientsList } from './IngredientsList';
import { cmsType } from '@llf/contracts';
export const CategoryDetailSchema = cmsType.component.CategoryDetail.extend({
  Popup: cmsType.component.TipsPopup.nullish(),
});
export type CategoryDetailProps = z.infer<typeof CategoryDetailSchema>;
export const CategoryDetailComponent = (props: BlockProps<CategoryDetailProps>) => {
  return (
    <>
      <IngredientsHeader {...props.block} />
      <IngredientsList {...props.block} />
    </>
  );
};
