import { z } from 'zod';
import { type BlockProps } from '../types';
import { IngredientsHeader } from './IngredientsHeader';
import { IngredientsList } from './IngredientsList';
import { cmsType } from '@llf/contracts';
import type { SearchDocument } from '@/lib/search';
export const CategoryDataType = z.discriminatedUnion('DataType', [
  cmsType.api.Category.extend({
    DataType: z.literal('category'),
  }),
  cmsType.api.IngredientType.extend({
    DataType: z.literal('ingredient-type'),
  }),
]);
export type CategoryDataType = z.infer<typeof CategoryDataType>;
export const CategoryDetailWithSearchSchema = z.object({
  __component: z.enum(['component.category-detail', 'component.search']),
  id: z.number().int(),
  title: cmsType.shared.Title.nullish(),
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
  categoryData: CategoryDataType.nullish(),
});

export type CategoryDetailWithSearchProps = z.infer<typeof CategoryDetailWithSearchSchema>;

export const CategoryDetailComponent = async (props: BlockProps<CategoryDetailWithSearchProps>) => {
  const ingredients =
    props?.categoryData?.ingredients?.map((item: cmsType.api.Ingredient) => {
      return {
        ...item,
        tips: item.tips?.map((tip: cmsType.api.Tip) => ({
          ...tip,
          type: tip.tip_type?.title || '',
        })),
      } as unknown as SearchDocument;
    }) || [];
  return (
    <>
      <IngredientsHeader {...props.block} categoryData={props.categoryData as CategoryDataType} />
      <IngredientsList
        {...props.block}
        ingredients={ingredients.length > 0 ? ingredients : undefined}
      />
    </>
  );
};
