import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createMockProvider } from '../extract/mock';
import type { ExtractionProvider } from '../extract';
import { staticCatalogSource } from '../catalog';
import { runGapCase, runGapSet, summarizeGapResults } from './gap-runner';
import { loadGapSet } from './gap-set';

const FIXTURE = fileURLToPath(new URL('../fixtures/catalog.json', import.meta.url));
const catalog = staticCatalogSource(JSON.parse(readFileSync(FIXTURE, 'utf8')));
const provider = createMockProvider();

describe('gap-runner', () => {
  it('keeps expected classes and drops personal', async () => {
    const result = await runGapCase(
      {
        id: 't1',
        terms: [
          { term: 'dragonfruit', expectedClass: 'edible' },
          { term: 'orange peel', expectedClass: 'compostable' },
          { term: 'plastic wrap', expectedClass: 'inedible' },
          { term: 'Sarah', expectedClass: 'personal' },
          { term: 'insulin', expectedClass: 'personal' },
          { term: '555-123-4567', expectedClass: 'personal' },
        ],
      },
      { provider, model: 'mock', catalog },
    );

    expect(result.leaks).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.wrongClass).toEqual([]);
    expect(result.passed).toBe(true);
    expect(result.kept.map((g) => g.name).sort()).toEqual([
      'dragonfruit',
      'orange peel',
      'plastic wrap',
    ]);
  });

  it('reports wrong-class when expected edible term is dropped because model misclassifies', async () => {
    // tahini is edible in mock's map. Let's use a custom mock that says
    // exclude for tahini → modelClass mismatch with expected edible, plus
    // filter drops it → goes to missing/wrongClass bucket.
    const misclass = {
      ...createMockProvider(),
      name: 'misclass',
      async classifyGaps(terms: readonly string[], _ctx: unknown) {
        return {
          result: {
            items: terms.map((t) => ({
              name: t.trim().toLowerCase(),
              class: 'exclude' as const, // excludes everything
            })),
          },
        };
      },
    };

    const result = await runGapCase(
      {
        id: 'mismatch',
        terms: [{ term: 'tahini', expectedClass: 'edible' }],
      },
      { provider: misclass, model: 'misclass', catalog },
    );

    expect(result.missing).toEqual(['tahini']);
    expect(result.wrongClass).toEqual(['tahini']);
    expect(result.passed).toBe(false);
  });

  it('summarizes privacy bar and class accuracy across cases', async () => {
    const results = await runGapSet(
      {
        version: 'unit',
        cases: [
          {
            id: 'good-1',
            terms: [
              { term: 'dragonfruit', expectedClass: 'edible' },
              { term: 'Sarah', expectedClass: 'personal' },
            ],
          },
          {
            id: 'good-2',
            terms: [
              { term: 'foil', expectedClass: 'inedible' },
              { term: 'Grandma', expectedClass: 'personal' },
            ],
          },
        ],
      },
      { provider, model: 'mock', catalog },
    );

    expect(results.summary).toMatchObject({
      cases: 2,
      passed: 2,
      leakedCases: 0,
      privacyPassed: true,
      perfectPass: true,
    });
  });

  it('attributes personal drops to the model or to a filter rule', async () => {
    // A model that labels every term edible would let names through, so the
    // denylist has to remove them — that is the D35-critical attribution.
    const gullible = {
      ...createMockProvider(),
      name: 'gullible',
      async classifyGaps(terms: readonly string[]) {
        return {
          result: {
            items: terms.map((t) => ({ name: t.trim().toLowerCase(), class: 'edible' as const })),
          },
        };
      },
    };

    const result = await runGapCase(
      {
        id: 'attribution',
        terms: [
          { term: "Max's kibble", expectedClass: 'personal' },
          { term: '555-123-4567', expectedClass: 'personal' },
          { term: 'quinoa', expectedClass: 'edible' },
        ],
      },
      { provider: gullible, model: 'gullible', catalog },
    );

    const byTerm = Object.fromEntries(result.model.map((row) => [row.term, row.droppedBy]));
    expect(byTerm).toEqual({
      "Max's kibble": 'filter',
      '555-123-4567': 'filter',
      quinoa: 'kept',
    });
    expect(result.leaks).toEqual([]);
    expect(summarizeGapResults([result])).toMatchObject({
      personalDroppedByFilter: 2,
      personalDroppedByModel: 0,
      privacyPassed: true,
    });
  });

  it('counts personal drops the model made itself separately', async () => {
    const result = await runGapCase(
      {
        id: 'model-excludes',
        terms: [
          { term: 'Sarah', expectedClass: 'personal' },
          { term: 'insulin', expectedClass: 'personal' },
        ],
      },
      { provider, model: 'mock', catalog },
    );

    expect(result.model.every((row) => row.droppedBy === 'model')).toBe(true);
    expect(summarizeGapResults([result])).toMatchObject({
      personalDroppedByFilter: 0,
      personalDroppedByModel: 2,
    });
  });

  it('treats a missing classifier as a failed run, not a crash', async () => {
    const noclassify = {
      name: 'noclassify',
      async extract() {
        return { result: {}, usage: { inputTokens: 0, outputTokens: 0 } };
      },
    } as unknown as ExtractionProvider;
    await expect(
      runGapCase(
        { id: 'bad', terms: [{ term: 'quinoa', expectedClass: 'edible' }] },
        { provider: noclassify, model: 'x', catalog },
      ),
    ).resolves.toMatchObject({ passed: false, error: /classifyGaps/ });
  });
});

describe('gap-set schema', () => {
  it('parses the v1 ground-truth set end to end', async () => {
    const set = await loadGapSet(
      fileURLToPath(new URL('../../../../eval/sets/gaps-v1.json', import.meta.url)),
    );
    expect(set.version).toBe('gaps-v1');
    expect(set.cases.length).toBeGreaterThanOrEqual(30);
    for (const item of set.cases) {
      expect(item.id).toMatch(/^[a-z0-9][a-z0-9-]*$/);
      expect(item.terms.length).toBeGreaterThan(0);
    }
  });
});

describe('summarizeGapResults', () => {
  it('computes the privacy bar correctly on an empty run', () => {
    const s = summarizeGapResults([]);
    expect(s.cases).toBe(0);
    expect(s.privacyPassed).toBe(true);
    expect(s.perfectPass).toBe(true);
  });
});
