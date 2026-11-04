import type { cms } from '@llf/contracts';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { requirePage } from '@/lib/cms';
import { FindMyTipsTemplate } from './FindMyTipsTemplate';
import { templateFor, templates } from './registry';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(cleanup);

function modules(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>('[data-module-index]')].map((el) => ({
    index: el.dataset.moduleIndex,
    type: el.dataset.moduleType,
  }));
}

describe('templateFor', () => {
  it.each(Object.keys(templates) as cms.PageTemplate[])('picks the %s template', (template) => {
    expect(templateFor({ template })).toBe(templates[template]);
  });

  it('falls back to the generic template', () => {
    expect(templateFor({ template: 'retired' as cms.PageTemplate })).toBe(templates.generic);
  });
});

// describe('HomeTemplate', () => {
//   it('renders the hero, intro, and featured slots before main, with page-wide indexes', async () => {
//     const page = await requirePage('');
//     const { container, getByRole } = render(<HomeTemplate page={page} />);
//     expect(modules(container)).toEqual([
//       { index: '0', type: 'hero' },
//       { index: '1', type: 'intro' },
//       { index: '2', type: 'carousel' },
//       { index: '3', type: 'search' },
//       { index: '4', type: 'tip-list' },
//     ]);
//     expect(getByRole('heading', { level: 2, name: strings.home.featuredTitle })).toBeTruthy();
//     // The hero carries the page's h1, so the template adds no heading of its own.
//     expect(container.querySelectorAll('h1')).toHaveLength(1);
//   });

//   it('skips empty slots and keeps indexes contiguous', async () => {
//     const page = await requirePage('');
//     const { container } = render(
//       <HomeTemplate page={{ ...page, hero: null, intro: null, featured: [] }} />,
//     );
//     expect(modules(container)).toEqual([
//       { index: '0', type: 'search' },
//       { index: '1', type: 'tip-list' },
//     ]);
//     expect(container.querySelector('h1')?.textContent).toBe(page.title);
//   });
// });

describe('FindMyTipsTemplate', () => {
  it('renders the tool slot first and offsets the dynamic zone', async () => {
    const page = await requirePage('find-my-tips');
    const extra: cms.UnknownBlock = { __component: 'custom.search', id: 99, placeholder: 'Search' };
    const { container } = render(<FindMyTipsTemplate page={{ ...page, main: [extra] }} />);
    expect(modules(container)).toEqual([
      { index: '0', type: 'tool' },
      { index: '1', type: 'search' },
    ]);
  });

  it('renders main from index 0 when the tool slot is empty', async () => {
    const page = await requirePage('find-my-tips');
    const extra: cms.UnknownBlock = { __component: 'custom.search', id: 99, placeholder: 'Search' };
    const { container } = render(
      <FindMyTipsTemplate page={{ ...page, tool: null, main: [extra] }} />,
    );
    expect(modules(container)).toEqual([{ index: '0', type: 'search' }]);
  });
});
