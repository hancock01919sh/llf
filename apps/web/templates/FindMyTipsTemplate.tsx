import { DynamicZone } from '@/blocks/DynamicZone';
import { PageHeading } from './PageHeading';
import type { TemplateProps } from './types';

/**
 * Find My Tips (Figma tool frames).
 * TODO(BD3244-26): replace the dynamic zone with the fixed Figma layout and its CMS slot fields.
 * Until then it renders the page's blocks so the route works end to end.
 */
export function FindMyTipsTemplate({ page }: TemplateProps) {
  return (
    <>
      <PageHeading page={page} />
      <DynamicZone page={page} />
    </>
  );
}
