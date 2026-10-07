import { FindMyTipsTemplate } from './FindMyTipsTemplate';
import { GenericTemplate } from './GenericTemplate';
import { HomeTemplate } from './HomeTemplate';
import { LibraryTemplate } from './LibraryTemplate';
import type { TemplateRegistry } from './types';

/**
 * Page templates (TDD §6.4). To add one: the template, its slot fields on Page, a Zod schema for
 * the slots, a story, and an entry here.
 * TODO(BD3244-11): pick the template from `Page.template` once the field exists. Until then each
 * route uses a fixed template.
 */
export const templates = {
  generic: GenericTemplate,
  home: HomeTemplate,
  'find-my-tips': FindMyTipsTemplate,
  library: LibraryTemplate,
} satisfies TemplateRegistry;

export type TemplateKey = keyof typeof templates;
