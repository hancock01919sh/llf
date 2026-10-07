import type { cms } from '@llf/contracts';
import { SearchForm } from '@/components/SearchForm';
import type { BlockProps } from './types';

/** Search box (`custom.search`). The placeholder is CMS content; labels are site strings. */
export function SearchBox({ block }: BlockProps<cms.SearchBlock>) {
  return <SearchForm placeholder={block.placeholder || undefined} className="mx-auto max-w-2xl" />;
}
