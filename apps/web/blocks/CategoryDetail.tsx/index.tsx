import { z } from 'zod';
import { BlockBaseSchema, LinkSchema, type BlockProps } from '../types';
import { BlocksContent, Media } from '@llf/contracts/cms';
import { IngredientsHeader } from './IngredientsHeader';
import { IngredientsList } from './IngredientsList';
export const FindTipsPopupSchema = BlockBaseSchema.extend({
  Link: LinkSchema,
});
export type FindTipsPopupProps = z.infer<typeof FindTipsPopupSchema>;
export const CategoryDetailSchema = BlockBaseSchema.extend({
  SubTitle: z.string().nullish(),
  Statement: BlocksContent,
  Button: LinkSchema,
  Image: Media.nullable(),
  Popup: FindTipsPopupSchema,
  Placeholder: z.string().nullish(),
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
