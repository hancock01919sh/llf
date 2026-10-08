import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { caseInput, LabeledCase, LabeledSet, loadLabeledSet } from './labeled-set';

const TEXT_CASE = {
  id: 'list-1',
  kind: 'text',
  text: 'bananas, whole milk',
  detectedType: 'shopping_list',
  expectedReadable: true,
  expectedSlugs: ['banana', 'milk'],
};

const IMAGE_CASE = {
  id: 'fridge-1',
  kind: 'image',
  imagePath: 'images/fridge-1.jpg',
  mimeType: 'image/jpeg',
  detectedType: 'fridge_photo',
  expectedReadable: true,
  expectedSlugs: ['milk'],
};

const issuePaths = (value: unknown, schema: typeof LabeledCase | typeof LabeledSet) => {
  const parsed = schema.safeParse(value);
  expect(parsed.success).toBe(false);
  return parsed.error?.issues.map((issue) => issue.path) ?? [];
};

describe('LabeledCase', () => {
  it('parses text and image cases and defaults injection to false', () => {
    expect(LabeledCase.parse(TEXT_CASE).injection).toBe(false);
    expect(LabeledCase.parse({ ...IMAGE_CASE, injection: true }).injection).toBe(true);
  });

  it('requires text on text cases', () => {
    const { text: _text, ...rest } = TEXT_CASE;
    expect(issuePaths(rest, LabeledCase)).toContainEqual(['text']);
  });

  it('requires both image fields on image cases', () => {
    const { mimeType: _mimeType, ...noMime } = IMAGE_CASE;
    const { imagePath: _imagePath, ...noPath } = IMAGE_CASE;
    expect(issuePaths(noMime, LabeledCase)).toContainEqual(['imagePath']);
    expect(issuePaths(noPath, LabeledCase)).toContainEqual(['imagePath']);
  });

  it('rejects duplicate slugs, bad ids, and unknown slugs', () => {
    expect(
      issuePaths({ ...TEXT_CASE, expectedSlugs: ['milk', 'milk'] }, LabeledCase),
    ).toContainEqual(['expectedSlugs']);
    expect(issuePaths({ ...TEXT_CASE, id: 'Bad Id' }, LabeledCase)).toContainEqual(['id']);
    expect(LabeledCase.safeParse({ ...TEXT_CASE, expectedSlugs: ['Not A Slug'] }).success).toBe(
      false,
    );
  });
});

describe('LabeledSet', () => {
  it('needs at least one case', () => {
    expect(LabeledSet.safeParse({ version: 'v0', cases: [] }).success).toBe(false);
  });

  it('rejects duplicate ids at the second occurrence', () => {
    const value = { version: 'v0', cases: [TEXT_CASE, IMAGE_CASE, TEXT_CASE] };
    expect(issuePaths(value, LabeledSet)).toContainEqual(['cases', 2, 'id']);
  });
});

describe('loadLabeledSet and caseInput', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'llf-eval-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('loads a set and reads images relative to the set file', async () => {
    const setPath = join(dir, 'set.json');
    await writeFile(setPath, JSON.stringify({ version: 'v0', cases: [TEXT_CASE, IMAGE_CASE] }));
    await mkdir(join(dir, 'images'));
    await writeFile(join(dir, 'images', 'fridge-1.jpg'), new Uint8Array([0xff, 0xd8, 0xff]));

    const set = await loadLabeledSet(setPath);
    expect(set.cases.map((item) => item.id)).toEqual(['list-1', 'fridge-1']);

    const [text, image] = set.cases;
    expect(await caseInput(text!, setPath)).toEqual({ kind: 'text', text: 'bananas, whole milk' });
    const input = await caseInput(image!, setPath);
    expect(input.kind).toBe('image');
    if (input.kind === 'image') {
      expect(input.mimeType).toBe('image/jpeg');
      expect([...input.bytes]).toEqual([0xff, 0xd8, 0xff]);
    }
  });

  it('rejects an invalid set file', async () => {
    const setPath = join(dir, 'set.json');
    await writeFile(setPath, JSON.stringify({ version: 'v0', cases: [] }));
    await expect(loadLabeledSet(setPath)).rejects.toThrow();
  });

  it('rejects when an image is missing', async () => {
    const setPath = join(dir, 'set.json');
    await expect(caseInput(LabeledCase.parse(IMAGE_CASE), setPath)).rejects.toThrow();
  });
});
