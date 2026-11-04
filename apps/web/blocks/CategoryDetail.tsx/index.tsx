import { z } from 'zod';
import { type BlockProps } from '../types';
import { IngredientsHeader } from './IngredientsHeader';
import { IngredientsList } from './IngredientsList';
import { cmsType } from '@llf/contracts';

export const CategoryDetailSchema = z.object({
  Background_color: z.enum(['forest', 'paper']).nullish(),
  Statement: cmsType.Block.array().nullish(),
  Hint: z.string().nullish(),
  Placeholder: z.string().nullish(),
  Popup: cmsType.component.TipsPopup,
  id: z.number().int(),
  __component: z.enum(['component.category-detail', 'component.search']),
  Title: z.string(),
  Description: z.string(),
  SubTitle: z.string().nullish(),
  isFullwidth: z.boolean().default(false),
  Button: cmsType.shared.Links.nullish(),
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
