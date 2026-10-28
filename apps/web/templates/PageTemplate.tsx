import { DynamicZone } from '@/blocks/DynamicZone';
import type { TemplateProps } from './types';
export function PageTemplate({ page }: TemplateProps) {
  return (
    <>
      <DynamicZone page={page} />
    </>
  );
}
