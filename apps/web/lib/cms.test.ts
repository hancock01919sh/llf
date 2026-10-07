import { describe, expect, it } from 'vitest';
import {
  ContentError,
  getCategories,
  getCategory,
  getGroups,
  getPageByPath,
  getPages,
  getTips,
  requirePage,
  toQuery,
  validateCollection,
} from './cms';

describe('toQuery', () => {
  it('serializes nested params in Strapi bracket syntax', () => {
    expect(toQuery({ populate: { tips: { populate: { tip_type: true } } }, pagination: { pageSize: 100 } })).toEqual([
      'populate%5Btips%5D%5Bpopulate%5D%5Btip_type%5D=true',
      'pagination%5BpageSize%5D=100',
    ]);
  });
});

describe('validateCollection', () => {
  it('names every entry an editor has to fix', () => {
    const run = () =>
      validateCollection('tips', [
        { id: 1, documentId: 'ok1', title: 'Fine' },
        { id: 2, documentId: 'bad1', title: 42 },
        { id: 3, title: 'No document id' },
      ]);
    expect(run).toThrow(ContentError);
    try {
      run();
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('Fix these entries in Strapi and publish again');
      expect(message).toContain('tips #2 "42" (documentId bad1): title:');
      expect(message).toContain('tips #3 "No document id": documentId:');
      expect(message).not.toContain('Fine');
    }
  });
});

describe('fixtures (the content contract)', () => {
  it('every collection validates', async () => {
    await expect(getPages()).resolves.not.toHaveLength(0);
    await expect(getCategories()).resolves.not.toHaveLength(0);
    await expect(getGroups()).resolves.not.toHaveLength(0);
    await expect(getTips()).resolves.not.toHaveLength(0);
  });

  it('has the pages the fixed templates need', async () => {
    for (const path of ['/', 'tips', 'find-my-tips', 'about']) {
      await expect(requirePage(path)).resolves.toBeTruthy();
    }
    await expect(getPageByPath('/about/')).resolves.toMatchObject({ path: expect.stringMatching(/about/) });
    await expect(requirePage('missing-page')).rejects.toThrow(ContentError);
  });

  it('looks categories up by slug', async () => {
    const [first] = await getCategories();
    expect(first).toBeDefined();
    await expect(getCategory(first!.slug)).resolves.toEqual(first);
    await expect(getCategory('nope')).resolves.toBeUndefined();
  });
});
