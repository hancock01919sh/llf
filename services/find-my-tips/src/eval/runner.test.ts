import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { catalogFromData } from '../catalog';
import { createMockProvider } from '../extract';
import type { ExtractionProvider } from '../extract';
import { ToolError } from '../http';
import { PUBLIC_IP, fakeResolver, fakeTransport, recipePage } from '../test-utils';
import { LabeledSet } from './labeled-set';
import type { EvalOptions } from './runner';
import { providerStatus, runEval } from './runner';

const fixture: unknown = JSON.parse(
  readFileSync(new URL('../fixtures/catalog.json', import.meta.url), 'utf8'),
);
const { matcher } = catalogFromData(fixture);
const SET_PATH = fileURLToPath(new URL('./not-a-real-set.json', import.meta.url));
const SOURCES = { test: { description: 'Test fixtures', license: 'n/a', piiReviewed: true } };

function clock(step = 10): () => number {
  let t = 0;
  return () => (t += step) - step;
}

function textCase(id: string, text: string, expectedSlugs: string[]) {
  return {
    id,
    kind: 'text',
    text,
    detectedType: 'shopping_list',
    expectedReadable: true,
    expectedSlugs,
  };
}

function options(cases: unknown[], overrides: Partial<EvalOptions> = {}): EvalOptions {
  return {
    set: LabeledSet.parse({ version: 't', sources: SOURCES, cases }),
    setPath: SET_PATH,
    provider: createMockProvider(),
    model: 'm',
    promptVersion: 'p',
    timeoutMs: 1000,
    matcher,
    pricing: { inputPerMTok: 1, outputPerMTok: 0 },
    now: clock(),
    ...overrides,
  };
}

function failing(error: Error): ExtractionProvider {
  return {
    name: 'failing',
    extract: () => Promise.reject(error),
  };
}

const VALID = {
  readable: true,
  detectedType: 'shopping_list',
  items: [{ term: 'bananas', isFood: true, inferred: false }],
};

describe('runEval', () => {
  it('scores a passing case through extract and match', async () => {
    const run = await runEval(options([textCase('ok', 'bananas, whole milk', ['banana', 'milk'])]));
    expect(run.stoppedEarly).toBe(false);
    expect(run.skipped).toBe(0);
    expect(run.scores).toHaveLength(1);
    const [score] = run.scores;
    expect(score).toMatchObject({ id: 'ok', passed: true, latencyMs: 10, unmatchedTerms: [] });
    expect(score?.errorCode).toBeUndefined();
    expect(run.report.overall).toMatchObject({ cases: 1, passed: 1, precision: 1, recall: 1 });
  });

  it('scores a provider timeout as a failed case', async () => {
    const run = await runEval(
      options([textCase('slow', 'bananas', ['banana'])], {
        provider: failing(new ToolError('timeout')),
      }),
    );
    expect(run.scores[0]).toMatchObject({ passed: false, errorCode: 'timeout' });
    expect(run.report.overall.timeouts).toBe(1);
  });

  it('scores a provider crash as upstream_error', async () => {
    const run = await runEval(
      options([textCase('boom', 'bananas', ['banana'])], { provider: failing(new Error('nope')) }),
    );
    expect(run.scores[0]).toMatchObject({ passed: false, errorCode: 'upstream_error' });
    expect(run.scores[0]?.providerStatus).toBeUndefined();
  });

  it('records the HTTP status of a failed provider call', async () => {
    const run = await runEval(
      options([textCase('busy', 'bananas', ['banana'])], {
        provider: failing(new Error('gemini: HTTP 503')),
      }),
    );
    expect(run.scores[0]).toMatchObject({ errorCode: 'upstream_error', providerStatus: 503 });
    expect(providerStatus(Object.assign(new Error('rate limited'), { status: 429 }))).toBe(429);
    expect(providerStatus('HTTP 500')).toBeUndefined();
  });

  it('scores schema-invalid output as upstream_error', async () => {
    const provider: ExtractionProvider = {
      name: 'bogus',
      extract: () => Promise.resolve({ result: { bogus: true } }),
    };
    const run = await runEval(options([textCase('bogus', 'bananas', ['banana'])], { provider }));
    expect(run.scores[0]).toMatchObject({ passed: false, errorCode: 'upstream_error' });
  });

  it('rejects the run when an image file is missing', async () => {
    const cases = [
      {
        id: 'missing-image',
        kind: 'image',
        imagePath: 'images/does-not-exist.jpg',
        mimeType: 'image/jpeg',
        detectedType: 'fridge_photo',
        expectedReadable: true,
        expectedSlugs: [],
        source: 'test',
      },
    ];
    await expect(runEval(options(cases))).rejects.toThrow();
  });

  it('runs url cases through the URL pipeline and records the source', async () => {
    const urlDeps = {
      resolve: fakeResolver({ 'recipes.test': [PUBLIC_IP] }),
      transport: fakeTransport({
        'https://recipes.test/pie': { html: recipePage(['2 cups whole milk', '3 bananas']) },
      }),
    };
    const cases = [
      {
        id: 'pie',
        kind: 'url',
        url: 'https://recipes.test/pie',
        detectedType: 'recipe',
        expectedReadable: true,
        expectedSlugs: ['banana', 'milk'],
      },
    ];
    const pipeline = await runEval(options(cases, { urlDeps }));
    expect(pipeline.scores[0]).toMatchObject({ passed: true, urlSource: 'jsonld' });
    const model = await runEval(options(cases, { urlDeps, urlPath: 'model' }));
    expect(model.scores[0]).toMatchObject({ urlSource: 'model' });
  });

  it('stops before the next case once the budget is spent', async () => {
    const provider: ExtractionProvider = {
      name: 'pricey',
      extract: () =>
        Promise.resolve({ result: VALID, usage: { inputTokens: 1_000_000, outputTokens: 0 } }),
    };
    const cases = ['a', 'b', 'c'].map((id) => textCase(id, 'bananas', ['banana']));
    const run = await runEval(options(cases, { provider, budgetUsd: 1 }));
    expect(run.scores.map((s) => s.id)).toEqual(['a']);
    expect(run.skipped).toBe(2);
    expect(run.stoppedEarly).toBe(true);
    expect(run.report.overall.costUsd).toBe(1);
  });
});
