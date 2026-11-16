import type { CategoryDataType } from '@/blocks/CategoryDetail.tsx';
import type { cmsType } from '@llf/contracts';
import type { ComponentType } from 'react';

export interface TemplateProps {
  page: cmsType.api.Page;
  categoryData?: CategoryDataType;
}

export type TemplateRegistry = Record<string, ComponentType<TemplateProps>>;
