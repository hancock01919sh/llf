import type { cms } from '@llf/contracts';

/**
 * Every page has exactly one h1 (TDD §6.6). A leading hero renders it; otherwise the template
 * renders the page title as a visually hidden h1 so screen-reader navigation still starts there.
 */
export function PageHeading({ page }: { page: Pick<cms.Page, 'title' | 'main'> }) {
  if (page.main[0]?.__component === 'component.hero') return null;
  return <h1 className="sr-only">{page.title}</h1>;
}
