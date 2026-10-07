import type { cms } from '@llf/contracts';
import { cn } from '@llf/ui';
import Link from 'next/link';
import { CmsTitle } from '@/components/Heading';
import { RichText } from '@/components/RichText';
import { pageHref } from '@/lib/paths';
import type { BlockProps } from './types';

/** Link list (`component.link-list`): links to CMS pages. */
export function LinkList({ block }: BlockProps<cms.LinkListBlock>) {
  if (block.pages.length === 0) return null;
  return (
    <div className="flex flex-col gap-md">
      <CmsTitle title={block.title} className="text-3xl" />
      <RichText content={block.description} className="text-paragraph" />
      <ul className={cn('grid gap-sm', block.layout === 'Two Column' && 'sm:grid-cols-2')}>
        {block.pages.map((page) => (
          <li key={page.documentId}>
            <Link
              href={pageHref(page.path)}
              data-cta=""
              className="text-paragraph underline underline-offset-4"
            >
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
