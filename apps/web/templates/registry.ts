import type { cms } from '@llf/contracts';
import { FindMyTipsTemplate } from './FindMyTipsTemplate';
import { GenericTemplate } from './GenericTemplate';
import { HomeTemplate } from './HomeTemplate';
import { LibraryTemplate } from './LibraryTemplate';
import type { TemplateRegistry } from './types';

/**
 * Page templates (TDD §6.4, D21). To add one: the template, its slot fields on Page, a Zod schema
 * for the slots, a story, and an entry here. `Page.template` in the CMS picks the template for a
 * catch-all page; designed routes (`/`, `/find-my-tips`) use their own template directly.
 */
export const templates = {
  generic: GenericTemplate,
  home: HomeTemplate,
  'find-my-tips': FindMyTipsTemplate,
  library: LibraryTemplate,
} satisfies TemplateRegistry & Record<cms.PageTemplate, unknown>;

export type TemplateKey = keyof typeof templates;

export function templateFor(page: Pick<cms.Page, 'template'>) {
  return templates[page.template] ?? templates.generic;
}
