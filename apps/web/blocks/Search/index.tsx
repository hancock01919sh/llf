import { cmsType } from '@llf/contracts';
import { z } from 'zod';
export const SearchSchema = cmsType.component.Search.extend({
   Popup: cmsType.component.TipsPopup.nullish(),
});
export type SearchBlockProps = z.infer<typeof SearchSchema>
export { SearchBlock } from './SearchBlock'