import { DynamicZone } from '@/blocks/DynamicZone';
import { PageHeading } from './PageHeading';
import type { TemplateProps } from './types';

/** Any CMS page without a designed route: About, General Tips, Toolkit, and so on (TDD §6.4). */
export function GenericTemplate({ page }: TemplateProps) {
  return (
    <>
      <PageHeading page={page} />
      <DynamicZone page={page} />
    </>
  );
}
