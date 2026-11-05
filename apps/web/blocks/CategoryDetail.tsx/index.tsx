import { type BlockProps } from '../types';
import { IngredientsHeader } from './IngredientsHeader';
import { IngredientsList } from './IngredientsList';
import type { cmsType } from '@llf/contracts';
export const CategoryDetailComponent = (
  props: BlockProps<cmsType.component.CategoryDetailDeepRef>,
) => {
  return (
    <>
      <IngredientsHeader {...props.block} />
      <IngredientsList {...props.block} />
    </>
  );
};
