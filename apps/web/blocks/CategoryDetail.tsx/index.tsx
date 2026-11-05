import { z } from 'zod';
import { type BlockProps } from '../types';
import { IngredientsHeader } from './IngredientsHeader';
import { IngredientsList } from './IngredientsList';
import { cmsType } from '@llf/contracts';
export const CategoryDetailWithSearchSchema = z.object({
  __component: z.enum(['component.category-detail', 'component.search']),
  id: z.number().int(),
  title: z.string().nullish(),
  description: z.string(),
  image: cmsType.Media.array().nullish(),
  subTitle: z.string().nullish(),
  placeholder: z.string().nullish(),
  statement: cmsType.Block.array().nullish(),
  hint: z.string().nullish(),
  button: cmsType.shared.Links.nullish(),
  popup: cmsType.component.TipsPopupDeepRef.nullish(),
  isFullwidth: z.boolean().nullish().default(false),
  backgroundColor: z.enum(['paper', 'forest']).nullish(),
});

export type CategoryDetailWithSearchProps = z.infer<typeof CategoryDetailWithSearchSchema>;

export const CategoryDetailComponent = (props: BlockProps<CategoryDetailWithSearchProps>) => {
  return (
    <>
      <IngredientsHeader {...props.block} />
      <IngredientsList {...props.block} />
    </>
  );
};
