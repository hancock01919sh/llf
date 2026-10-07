import type { cms } from '@llf/contracts';
import type { ComponentType } from 'react';
import { ModuleBoundary } from '@/components/ModuleBoundary';
import { ContentError } from '@/lib/cms';
import { blockLayout, blocks, isBlockKey } from './registry';
import type { BlockProps } from './types';

export interface ResolvedBlock {
  key: string;
  type: string;
  id: number;
  layout: string | undefined;
  data: unknown;
  Component: ComponentType<BlockProps<unknown>>;
}

/**
 * Validates every block in a Page's dynamic zone against the registry (TDD §6.4).
 * Strict mode (builds and CI) throws one error listing every problem, so an editor can fix them
 * in one pass. Otherwise (`next dev`) bad blocks are skipped with a console warning.
 */
export function resolveBlocks(
  page: Pick<cms.Page, 'title' | 'path' | 'main'>,
  strict: boolean,
): ResolvedBlock[] {
  const problems: string[] = [];
  const resolved: ResolvedBlock[] = [];
  page.main.forEach((block, index) => {
    const where = `block #${index + 1} (${block.__component})`;
    if (!isBlockKey(block.__component)) {
      problems.push(`  • ${where}: the site has no component for this block type yet.`);
      return;
    }
    const entry = blocks[block.__component];
    const result = entry.schema.safeParse(block);
    if (!result.success) {
      const fields = result.error.issues
        .map((issue) => `${issue.path.join('.') || '(block)'}: ${issue.message}`)
        .join('; ');
      problems.push(`  • ${where}: ${fields}`);
      return;
    }
    resolved.push({
      key: `${block.__component}-${block.id}`,
      type: entry.type,
      id: block.id,
      layout: blockLayout(result.data),
      data: result.data,
      Component: entry.Component as ComponentType<BlockProps<unknown>>,
    });
  });
  if (problems.length > 0) {
    const message = `Page "${page.title}" (/${page.path.replace(/^\/+/, '')}) has blocks the site can't render:\n${problems.join('\n')}`;
    if (strict) throw new ContentError(`${message}\nFix them in Strapi and publish again.`);
    console.warn(`${message}\nSkipping them in development.`);
  }
  return resolved;
}

const isStrict = () => process.env.NODE_ENV !== 'development';

/** Renders a Page's `main` dynamic zone. Used by the generic template only (TDD §6.4). */
export function DynamicZone({ page }: { page: Pick<cms.Page, 'title' | 'path' | 'main'> }) {
  return resolveBlocks(page, isStrict()).map(({ key, type, id, layout, data, Component }, index) => (
    <ModuleBoundary key={key} type={type} index={index} id={String(id)} layout={layout}>
      <Component block={data} index={index} pageTitle={page.title} />
    </ModuleBoundary>
  ));
}
