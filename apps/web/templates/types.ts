import type { cmsType } from '@llf/contracts';
import type { ComponentType } from 'react';

export interface TemplateProps {
  page: cmsType.api.Page;
  categoryData?: cmsType.api.Category;
}

export type TemplateRegistry = Record<string, ComponentType<TemplateProps>>;
