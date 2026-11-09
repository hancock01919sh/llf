import type { cms } from '@llf/contracts';
import type { ComponentType } from 'react';

export interface TemplateProps {
  page: cms.Page;
  categoryData?: cms.Category;
}

export type TemplateRegistry = Record<string, ComponentType<TemplateProps>>;
