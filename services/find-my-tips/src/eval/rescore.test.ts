import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { catalogFromData } from '../catalog';
import type { ArenaResult } from './arena';
import { LabeledSet } from './labeled-set';
import type { CaseScore } from './metrics';
import { RescoreError, rescoreArena, rescoreCase } from './rescore';

const fixture = JSON.parse(
  readFileSync(new URL('../fixtures/catalog.json', import.meta.url), 'utf8'),
) as { catalogVersion: string; ingredients: { slug: string; title: string; synonyms: string[] }[] };
const { matcher } = catalogFromData(fixture);
// The same catalog with a synonym the fixture lacks.
const wider = catalogFromData({
  ...fixture,
  catalogVersion: 'wider',
  ingredients: fixture.ingredients.map((entry) =>
    entry.slug === 'bread' ? { ...entry, synonyms: [...entry.synonyms, 'focaccia'] } : entry,
  ),
}).matcher;

const set = LabeledSet.parse({
  version: 't',
  cases: [
    {
      id: 'a',
      kind: 'text',
      text: 'bananas and focaccia',
      detectedType: 'shopping_list',
      expectedReadable: true,
      expectedSlugs: ['banana', 'bread'],
    },
  ],
});
const item = set.cases[0]!;

const stored: CaseScore = {
  id: 'a',
  kind: 'text',
  detectedType: 'shopping_list',
  injection: false,
  expectedReadable: true,
  latencyMs: 900,
  tp: 1,
  fp: 0,
  fn: 1,
  readableCorrect: true,
  slugsExact: false,
  passed: false,
  matchedSlugs: ['banana'],
  missingSlugs: ['bread'],
  extraSlugs: [],
  acceptedSlugs: [],
  unmatchedCount: 1,
  unmatchedTerms: ['focaccia'],
  extractedItems: [
    { term: 'bananas', isFood: true, inferred: false },
    { term: 'focaccia', isFood: true, inferred: false },
  ],
  inputTokens: 500,
  outputTokens: 40,
  reasoningTokens: 0,
};

describe('rescoreCase', () => {
  it('reproduces the stored score with the same catalog', () => {
    const score = rescoreCase(stored, item, matcher);
    expect(score).toMatchObject({ tp: 1, fn: 1, unmatchedTerms: ['focaccia'], latencyMs: 900 });
  });

  it('matches terms a wider catalog knows, without a model call', () => {
    const score = rescoreCase(stored, item, wider);
    expect(score).toMatchObject({ tp: 2, fn: 0, passed: true, unmatchedCount: 0 });
    expect(score).toMatchObject({ inputTokens: 500, outputTokens: 40 });
  });

  it('keeps errors as errors', () => {
    const errored: CaseScore = { ...stored, errorCode: 'timeout', providerStatus: 504 };
    expect(rescoreCase(errored, item, wider)).toMatchObject({
      errorCode: 'timeout',
      providerStatus: 504,
      fn: 2,
    });
  });

  it('rejects a run that predates term recording', () => {
    const { extractedItems: _dropped, ...old } = stored;
    expect(() => rescoreCase(old, item, wider)).toThrow(RescoreError);
  });
});

describe('rescoreArena', () => {
  const pricing = { inputPerMTok: 1, outputPerMTok: 1 };
  const result = {
    cells: [
      {
        label: 'mock',
        cell: { provider: 'mock', model: 'm', pricing, enabled: true },
        run: { scores: [stored], report: {}, stoppedEarly: false, skipped: 0 },
        forecast: { rows: [] },
      },
    ],
    skipped: [],
    spentUsd: 0,
  } as unknown as ArenaResult;

  it('re-aggregates each cell', () => {
    const out = rescoreArena(result, set, wider);
    expect(out.cells[0]?.run.report.overall).toMatchObject({ precision: 1, recall: 1, passed: 1 });
  });

  it('refuses a set with cases the run never saw', () => {
    const bigger = LabeledSet.parse({ ...set, cases: [...set.cases, { ...item, id: 'b' }] });
    expect(() => rescoreArena(result, bigger, wider)).toThrow(/no output for b/);
  });
});
