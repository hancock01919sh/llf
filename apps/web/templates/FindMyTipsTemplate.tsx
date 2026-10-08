import { DynamicZone } from '@/blocks/DynamicZone';
import { FindMyTips } from '@/blocks/FindMyTips';
import { ModuleBoundary } from '@/components/ModuleBoundary';
import { PageHeading } from './PageHeading';
import type { TemplateProps } from './types';

/**
 * Find My Tips (Figma tool frames). The tool copy is a fixed slot on the Page (TDD D21). The
 * template renders no `main`; the dynamic zone only shows for pages saved before the slot existed.
 */
export function FindMyTipsTemplate({ page }: TemplateProps) {
  const offset = page.tool ? 1 : 0;
  return (
    <>
      <PageHeading page={page} />
      {page.tool ? (
        <ModuleBoundary type="tool" index={0} id={String(page.tool.id)}>
          <FindMyTips
            block={{ __component: 'custom.tool', ...page.tool }}
            index={0}
            pageTitle={page.title}
          />
        </ModuleBoundary>
      ) : null}
      <DynamicZone page={page} offset={offset} />
    </>
  );
}
