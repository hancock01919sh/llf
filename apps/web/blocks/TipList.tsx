import type { cms } from '@llf/contracts';
import { cn } from '@llf/ui';
import { CmsTitle, Heading, childLevel } from '@/components/Heading';
import type { BlockProps } from './types';

/**
 * Tip list (`custom.tip-list`). Tip cards only; the Tip Modal and Save/Share are shell UI built in
 * BD3244-8 (TDD §6.4, D22).
 */
export function TipList({ block }: BlockProps<cms.TipListBlock>) {
  if (block.tips.length === 0) return null;
  const itemLevel = childLevel(block.title?.copy ? block.title.header : 'h2');
  return (
    <div className="flex flex-col gap-md">
      <CmsTitle title={block.title} className="text-3xl" />
      {block.description ? <p className="text-paragraph">{block.description}</p> : null}
      <ul
        className={cn('grid gap-md', block.layout === 'Basic' && 'md:grid-cols-2 lg:grid-cols-3')}
      >
        {block.tips.map((tip) => (
          <li
            key={tip.documentId}
            className="flex flex-col gap-xs rounded-sm border border-line p-md"
          >
            {tip.tip_type ? <p className="text-label uppercase">{tip.tip_type.title}</p> : null}
            <Heading as={itemLevel} className="text-xl">
              {tip.title}
            </Heading>
            {tip.description ? <p className="text-paragraph">{tip.description}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
