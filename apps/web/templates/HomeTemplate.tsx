import type { ReactNode } from 'react';
import { DynamicZone } from '@/blocks/DynamicZone';
import { PageHeading } from './PageHeading';
import type { TemplateProps } from './types';

/**
 * Home (Figma Home frames). The hero, intro, and featured categories are fixed slots on the Page
 * (TDD D21); `main` follows them for anything editors add below. Module indexes run page-wide.
 */
export function HomeTemplate({ page }: TemplateProps) {
  const slots: ReactNode[] = [];
  return (
    <>
      <PageHeading page={page} />
      {slots}
      <DynamicZone page={page} offset={slots.length} />
    </>
  );
}
