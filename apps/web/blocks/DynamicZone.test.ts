import type { cmsType } from '@llf/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContentError } from '@/lib/cms';
import { resolveBlocks } from './DynamicZone';

const page = (main: unknown[]) =>
  ({ title: 'Test page', path: 'test', main }) as unknown as Pick<
    cmsType.api.Page,
    'title' | 'path' | 'main'
  >;

const good = { __component: 'component.toolkit-headline', id: 1, description: 'Find tips' };
const unknown = { __component: 'component.not-a-real-block', id: 2 };
// Hero mock mirrors the current `cms-type.component.Hero` schema (Strapi has no `layout` field).
const validHero = {
  __component: 'component.hero',
  id: 4,
  images: [],
  description: 'Everything you did not know about ingredients.',
  title: [],
  backgroundColor: 'terra',
};
const invalidHero = { ...validHero, id: 3, backgroundColor: 'paper' };

describe('resolveBlocks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('resolves registered blocks with their analytics type and layout', () => {
    const [block] = resolveBlocks(page([good, validHero]), true).slice(1);
    expect(resolveBlocks(page([good]), true)).toMatchObject([
      { key: 'component.toolkit-headline-1', type: 'toolkit-headline' },
    ]);
    expect(block).toMatchObject({ type: 'hero' });
  });

  it('fails the build on unknown or invalid blocks, naming each one', () => {
    expect(() => resolveBlocks(page([good, unknown, invalidHero]), true)).toThrow(ContentError);
    try {
      resolveBlocks(page([good, unknown, invalidHero]), true);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('Page "Test page" (/test)');
      expect(message).toContain('block #2 (component.not-a-real-block): the site has no component');
      expect(message).toContain('block #3 (component.hero): backgroundColor:');
      expect(message).toMatch(/Fix them in Strapi and publish again\.$/);
    }
  });

  it('skips bad blocks with a warning in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveBlocks(page([unknown, good]), false)).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Skipping them in development.'));
  });
});
