import type { cms } from '@llf/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContentError } from '@/lib/cms';
import { resolveBlocks } from './DynamicZone';

const page = (main: unknown[]) =>
  ({ title: 'Test page', path: 'test', main }) as unknown as Pick<
    cms.Page,
    'title' | 'path' | 'main'
  >;

const good = { __component: 'custom.search', id: 1, placeholder: 'Search' };
const unknown = { __component: 'component.accordion', id: 2 };
const invalid = { __component: 'component.hero', id: 3, layout: 'Sideways' };

describe('resolveBlocks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('resolves registered blocks with their analytics type and layout', () => {
    const [block] = resolveBlocks(
      page([good, { __component: 'component.hero', id: 4 }]),
      true,
    ).slice(1);
    expect(resolveBlocks(page([good]), true)).toMatchObject([
      { key: 'custom.search-1', type: 'search' },
    ]);
    expect(block).toMatchObject({ type: 'hero', layout: 'Primary' });
  });

  it('fails the build on unknown or invalid blocks, naming each one', () => {
    expect(() => resolveBlocks(page([good, unknown, invalid]), true)).toThrow(ContentError);
    try {
      resolveBlocks(page([good, unknown, invalid]), true);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('Page "Test page" (/test)');
      expect(message).toContain('block #2 (component.accordion): the site has no component');
      expect(message).toContain('block #3 (component.hero): layout:');
      expect(message).toMatch(/Fix them in Strapi and publish again\.$/);
    }
  });

  it('skips bad blocks with a warning in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveBlocks(page([unknown, good]), false)).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Skipping them in development.'));
  });
});
