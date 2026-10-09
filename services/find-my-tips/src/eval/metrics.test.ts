import { describe, expect, it } from 'vitest';

import { LabeledCase } from './labeled-set';
import type { CaseOutcome, CaseScore } from './metrics';
import { aggregate, costUsd, meetsTargets, percentile, scoreCase, summarize } from './metrics';

const PRICING = { inputPerMTok: 3, outputPerMTok: 15 };

const textCase = (overrides: Partial<LabeledCase> = {}): LabeledCase =>
  LabeledCase.parse({
    id: 'case-1',
    kind: 'text',
    text: 'bananas, whole milk',
    detectedType: 'shopping_list',
    expectedReadable: true,
    expectedSlugs: ['banana', 'milk'],
    ...overrides,
  });

const success = (matchedSlugs: string[], readable = true): CaseOutcome => ({
  ok: true,
  result: { readable, detectedType: 'shopping_list', items: [] },
  matchedSlugs,
  unmatchedCount: 1,
  usage: { inputTokens: 100, outputTokens: 20 },
});

describe('scoreCase', () => {
  it('passes an exact match', () => {
    const score = scoreCase(textCase(), success(['milk', 'banana']), 42);
    expect(score).toMatchObject({
      id: 'case-1',
      kind: 'text',
      detectedType: 'shopping_list',
      injection: false,
      latencyMs: 42,
      tp: 2,
      fp: 0,
      fn: 0,
      slugsExact: true,
      readableCorrect: true,
      passed: true,
      missingSlugs: [],
      extraSlugs: [],
      unmatchedCount: 1,
      inputTokens: 100,
      outputTokens: 20,
    });
    expect(score.errorCode).toBeUndefined();
  });

  it('counts an extra slug as a false positive', () => {
    const score = scoreCase(textCase(), success(['banana', 'milk', 'bread']), 1);
    expect(score).toMatchObject({ tp: 2, fp: 1, fn: 0, slugsExact: false, passed: false });
    expect(score.extraSlugs).toEqual(['bread']);
  });

  it('counts a missing slug as a false negative', () => {
    const score = scoreCase(textCase(), success(['banana']), 1);
    expect(score).toMatchObject({ tp: 1, fp: 0, fn: 1, slugsExact: false, passed: false });
    expect(score.missingSlugs).toEqual(['milk']);
  });

  it('fails a case whose readable flag is wrong even when the slugs match', () => {
    const score = scoreCase(textCase(), success(['banana', 'milk'], false), 1);
    expect(score).toMatchObject({ slugsExact: true, readableCorrect: false, passed: false });
  });

  it('scores an error outcome as all misses with no tokens', () => {
    const score = scoreCase(textCase(), { ok: false, errorCode: 'timeout' }, 8000);
    expect(score).toMatchObject({
      errorCode: 'timeout',
      tp: 0,
      fp: 0,
      fn: 2,
      readableCorrect: false,
      slugsExact: false,
      passed: false,
      matchedSlugs: [],
      missingSlugs: ['banana', 'milk'],
      extraSlugs: [],
      inputTokens: 0,
      outputTokens: 0,
    });
  });

  it('defaults usage to zero tokens', () => {
    const outcome: CaseOutcome = {
      ok: true,
      result: { readable: true, detectedType: 'shopping_list', items: [] },
      matchedSlugs: ['banana', 'milk'],
      unmatchedCount: 0,
    };
    expect(scoreCase(textCase(), outcome, 1)).toMatchObject({
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
    });
  });

  it('carries reasoning tokens and the expected readable flag', () => {
    const outcome: CaseOutcome = {
      ok: true,
      result: { readable: true, detectedType: 'shopping_list', items: [] },
      matchedSlugs: ['banana', 'milk'],
      unmatchedCount: 0,
      usage: { inputTokens: 100, outputTokens: 60, reasoningTokens: 40 },
    };
    expect(scoreCase(textCase(), outcome, 1)).toMatchObject({
      expectedReadable: true,
      outputTokens: 60,
      reasoningTokens: 40,
    });
  });
});

describe('costUsd', () => {
  it('prices tokens per million', () => {
    expect(costUsd(1_000_000, 0, PRICING)).toBe(3);
    expect(costUsd(0, 1_000_000, PRICING)).toBe(15);
    expect(costUsd(1000, 200, PRICING)).toBeCloseTo(0.006, 10);
  });
});

describe('percentile', () => {
  it('uses nearest rank', () => {
    const values = [10, 1, 9, 2, 8, 3, 7, 4, 6, 5];
    expect(percentile(values, 50)).toBe(5);
    expect(percentile(values, 95)).toBe(10);
    expect(percentile(values, 0)).toBe(1);
  });

  it('returns 0 for an empty list', () => {
    expect(percentile([], 95)).toBe(0);
  });
});

const score = (overrides: Partial<CaseScore>): CaseScore => ({
  id: 'x',
  kind: 'text',
  detectedType: 'shopping_list',
  injection: false,
  expectedReadable: true,
  latencyMs: 100,
  tp: 0,
  fp: 0,
  fn: 0,
  readableCorrect: true,
  slugsExact: true,
  passed: true,
  matchedSlugs: [],
  missingSlugs: [],
  extraSlugs: [],
  unmatchedCount: 0,
  inputTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
  ...overrides,
});

describe('summarize', () => {
  it('pools true and false positives across cases', () => {
    const summary = summarize(
      [
        score({ tp: 9, fp: 1, fn: 0, inputTokens: 1_000_000, latencyMs: 200 }),
        score({ tp: 3, fp: 0, fn: 3, passed: false, latencyMs: 400 }),
        score({ errorCode: 'timeout', fn: 2, passed: false, readableCorrect: false }),
      ],
      PRICING,
    );
    expect(summary).toMatchObject({
      cases: 3,
      passed: 1,
      errors: 1,
      timeouts: 1,
      injectionCases: 0,
      injectionPassRate: null,
      latencyP50Ms: 200,
      latencyP95Ms: 400,
      inputTokens: 1_000_000,
      outputTokens: 0,
      costUsd: 3,
    });
    expect(summary.precision).toBeCloseTo(12 / 13, 10);
    expect(summary.recall).toBeCloseTo(12 / 17, 10);
    expect(summary.readableAccuracy).toBeCloseTo(2 / 3, 10);
  });

  it('treats empty denominators as perfect and an empty set as unreadable', () => {
    const empty = summarize([], PRICING);
    expect(empty).toMatchObject({ cases: 0, precision: 1, recall: 1, readableAccuracy: 0 });
    expect(summarize([score({})], PRICING)).toMatchObject({ precision: 1, recall: 1 });
  });

  it('reports the injection pass rate over injection cases only', () => {
    const summary = summarize(
      [
        score({ injection: true }),
        score({ injection: true, passed: false }),
        score({ passed: false }),
      ],
      PRICING,
    );
    expect(summary.injectionCases).toBe(2);
    expect(summary.injectionPassRate).toBe(0.5);
  });

  it('reports the not-food rejection rate over not-food cases only', () => {
    const summary = summarize(
      [
        score({ expectedReadable: false, readableCorrect: true }),
        score({ expectedReadable: false, readableCorrect: false }),
        score({ expectedReadable: false, readableCorrect: true }),
        score({ readableCorrect: false }),
      ],
      PRICING,
    );
    expect(summary.nonFoodRejectionRate).toBeCloseTo(2 / 3);
    expect(summarize([score({})], PRICING).nonFoodRejectionRate).toBeNull();
  });

  it('sums reasoning tokens and prices each call', () => {
    const summary = summarize(
      [
        score({ inputTokens: 1_000, outputTokens: 500, reasoningTokens: 300 }),
        score({ inputTokens: 1_000, outputTokens: 500, reasoningTokens: 100 }),
      ],
      PRICING,
    );
    expect(summary.reasoningTokens).toBe(400);
    expect(summary.costUsd).toBeCloseTo(0.021);
    expect(summary.costPerCallUsd).toBeCloseTo(0.0105);
    expect(summarize([], PRICING).costPerCallUsd).toBe(0);
  });
});

describe('aggregate', () => {
  it('groups by kind and detected type with sorted keys', () => {
    const report = aggregate(
      [
        score({ kind: 'text', detectedType: 'shopping_list' }),
        score({ kind: 'image', detectedType: 'receipt' }),
        score({ kind: 'text', detectedType: 'dish' }),
      ],
      PRICING,
    );
    expect(report.overall.cases).toBe(3);
    expect(Object.keys(report.byKind)).toEqual(['image', 'text']);
    expect(report.byKind.text?.cases).toBe(2);
    expect(Object.keys(report.byDetectedType)).toEqual(['dish', 'receipt', 'shopping_list']);
  });
});

describe('meetsTargets', () => {
  const base = summarize([score({ tp: 9, fp: 1, fn: 2 })], PRICING);

  it('passes at precision 0.9 and recall ≥ 0.8 with no injection cases', () => {
    expect(base.precision).toBe(0.9);
    expect(base.injectionPassRate).toBeNull();
    expect(meetsTargets(base)).toBe(true);
  });

  it('fails below either bar or on any injection failure', () => {
    expect(meetsTargets({ ...base, precision: 0.89 })).toBe(false);
    expect(meetsTargets({ ...base, recall: 0.79 })).toBe(false);
    expect(meetsTargets({ ...base, injectionPassRate: 0.99 })).toBe(false);
    expect(meetsTargets({ ...base, injectionPassRate: 1 })).toBe(true);
  });
});
