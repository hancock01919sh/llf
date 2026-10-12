import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { catalogFromData } from '../catalog';
import { createMockProvider } from '../extract';
import type { ExtractionProvider } from '../extract';
import type { ArenaOptions } from './arena';
import { ArenaMatrix, cellLabel, missingFor, renderArenaMarkdown, runArena } from './arena';
import { LabeledSet } from './labeled-set';

const fixture: unknown = JSON.parse(
  readFileSync(new URL('../fixtures/catalog.json', import.meta.url), 'utf8'),
);
const { matcher } = catalogFromData(fixture);
const SET_PATH = fileURLToPath(new URL('./not-a-real-set.json', import.meta.url));

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

const SECRET_TEXT = 'bananas from the secret pantry';
const SET = LabeledSet.parse({
  version: 't',
  cases: ['a', 'b', 'c'].map((id) => textCase(id, SECRET_TEXT, ['banana'])),
});

const VALID = {
  readable: true,
  detectedType: 'shopping_list' as const,
  items: [{ term: 'bananas', isFood: true, inferred: false }],
};

/** $1 per call at pricing { inputPerMTok: 1, outputPerMTok: 0 }. */
const pricey: ExtractionProvider = {
  name: 'pricey',
  extract: () =>
    Promise.resolve({ result: VALID, usage: { inputTokens: 1_000_000, outputTokens: 0 } }),
};

const DOLLAR = { inputPerMTok: 1, outputPerMTok: 0 };
const FREE = { inputPerMTok: 0, outputPerMTok: 0 };

function matrix(input: unknown): ArenaMatrix {
  return ArenaMatrix.parse(input);
}

function options(m: ArenaMatrix, overrides: Partial<ArenaOptions> = {}): ArenaOptions {
  return {
    matrix: m,
    set: SET,
    setPath: SET_PATH,
    matcher,
    promptVersion: 'p',
    timeoutMs: 1000,
    providerFor: (cell) => (cell.provider === 'mock' ? createMockProvider() : pricey),
    now: clock(),
    ...overrides,
  };
}

describe('ArenaMatrix', () => {
  it('defaults cells to enabled', () => {
    const m = matrix({ cells: [{ provider: 'mock', model: 'm', pricing: FREE }] });
    expect(m.cells[0]?.enabled).toBe(true);
  });

  it('accepts an enabled gemini cell', () => {
    const m = matrix({
      cells: [
        { provider: 'gemini', model: 'gemini-2.5-flash-lite', effort: 'none', pricing: FREE },
      ],
    });
    expect(m.cells[0]).toMatchObject({ provider: 'gemini', enabled: true });
  });

  it('rejects an unknown provider', () => {
    expect(
      ArenaMatrix.safeParse({ cells: [{ provider: 'mistral', model: 'm', pricing: FREE }] })
        .success,
    ).toBe(false);
  });

  it('rejects duplicate cell labels', () => {
    const parsed = ArenaMatrix.safeParse({
      cells: [
        { provider: 'openai', model: 'gpt-5-mini', effort: 'low', pricing: FREE },
        { provider: 'openai', model: 'gpt-5-mini', effort: 'low', pricing: DOLLAR },
      ],
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe('duplicate cell label "openai/gpt-5-mini/low"');
  });

  it('rejects an empty matrix and negative prices', () => {
    expect(ArenaMatrix.safeParse({ cells: [] }).success).toBe(false);
    expect(
      ArenaMatrix.safeParse({
        cells: [{ provider: 'mock', model: 'm', pricing: { inputPerMTok: -1, outputPerMTok: 0 } }],
      }).success,
    ).toBe(false);
  });
});

describe('cellLabel', () => {
  it('prefers the explicit label', () => {
    expect(cellLabel({ label: 'cheap', provider: 'openai', model: 'gpt-5-nano' })).toBe('cheap');
  });

  it('joins provider, model, and effort', () => {
    expect(cellLabel({ provider: 'openai', model: 'gpt-5-nano', effort: 'minimal' })).toBe(
      'openai/gpt-5-nano/minimal',
    );
    expect(cellLabel({ provider: 'anthropic', model: 'claude-haiku' })).toBe(
      'anthropic/claude-haiku',
    );
  });
});

describe('missingFor', () => {
  it('names the missing key and its open question', () => {
    expect(missingFor('anthropic', {})).toBe('no ANTHROPIC_API_KEY (OPEN-2)');
    expect(missingFor('openai', { anthropicApiKey: 'k' })).toBe('no OPENAI_API_KEY (OPEN-1)');
    expect(missingFor('gemini', { anthropicApiKey: 'k', openaiApiKey: 'k' })).toBe(
      'no GEMINI_API_KEY',
    );
    expect(missingFor('bedrock', { anthropicApiKey: 'k', openaiApiKey: 'k' })).toMatch(/stub/);
  });

  it('lets mock and keyed providers run', () => {
    expect(missingFor('mock', {})).toBeUndefined();
    expect(missingFor('openai', { openaiApiKey: 'k' })).toBeUndefined();
    expect(missingFor('anthropic', { anthropicApiKey: 'k' })).toBeUndefined();
    expect(missingFor('gemini', { geminiApiKey: 'k' })).toBeUndefined();
  });
});

describe('runArena', () => {
  it('runs every enabled cell and forecasts each', async () => {
    const m = matrix({
      usesPerMonth: [25_000],
      monthlyCapUsd: 500,
      cells: [{ provider: 'mock', model: 'm', pricing: FREE }],
    });
    const result = await runArena(options(m));
    expect(result.skipped).toEqual([]);
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0]?.run.report.overall).toMatchObject({ cases: 3 });
    expect(result.cells[0]?.forecast.rows[0]).toMatchObject({
      usesPerMonth: 25_000,
      monthlyUsd: 0,
    });
    expect(result.spentUsd).toBe(0);
    expect(result.budgetUsd).toBeUndefined();
  });

  it('skips disabled cells with their note', async () => {
    const m = matrix({
      cells: [
        { provider: 'mock', model: 'm', pricing: FREE },
        { provider: 'openai', model: 'x', pricing: FREE, enabled: false },
        {
          provider: 'gemini',
          model: 'g',
          pricing: FREE,
          enabled: false,
          note: 'parked for this run',
        },
      ],
    });
    const result = await runArena(options(m));
    expect(result.cells.map((c) => c.label)).toEqual(['mock/m']);
    expect(result.skipped).toEqual([
      { label: 'openai/x', reason: 'disabled in the matrix' },
      { label: 'gemini/g', reason: 'parked for this run' },
    ]);
  });

  it('skips cells the provider factory refuses', async () => {
    const m = matrix({ cells: [{ provider: 'openai', model: 'x', pricing: DOLLAR }] });
    const result = await runArena(
      options(m, { providerFor: (cell) => ({ skip: missingFor(cell.provider, {}) ?? '' }) }),
    );
    expect(result.cells).toEqual([]);
    expect(result.skipped).toEqual([{ label: 'openai/x', reason: 'no OPENAI_API_KEY (OPEN-1)' }]);
  });

  it('holds the global cap across cells', async () => {
    const m = matrix({
      budgetUsd: 1,
      cells: [
        { label: 'first', provider: 'openai', model: 'a', pricing: DOLLAR },
        { label: 'second', provider: 'openai', model: 'b', pricing: DOLLAR },
      ],
    });
    const result = await runArena(options(m));
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0]).toMatchObject({ label: 'first', budgetUsd: 1 });
    expect(result.cells[0]?.run.stoppedEarly).toBe(true);
    expect(result.skipped).toEqual([{ label: 'second', reason: 'global cap reached' }]);
    expect(result.spentUsd).toBe(1);
    expect(result.budgetUsd).toBe(1);
  });

  it('caps a cell at the smaller of its own cap and what is left', async () => {
    const m = matrix({
      budgetUsd: 10,
      cells: [
        { label: 'own-cap', provider: 'openai', model: 'a', pricing: DOLLAR, budgetUsd: 2 },
        { label: 'remainder', provider: 'openai', model: 'b', pricing: DOLLAR, budgetUsd: 50 },
      ],
    });
    const result = await runArena(options(m, { budgetUsd: 4 }));
    expect(result.budgetUsd).toBe(4);
    expect(result.cells.map((c) => [c.label, c.budgetUsd])).toEqual([
      ['own-cap', 2],
      ['remainder', 2],
    ]);
    expect(result.spentUsd).toBe(4);
  });

  it('runs uncapped when no cap is set anywhere', async () => {
    const m = matrix({ cells: [{ provider: 'openai', model: 'a', pricing: DOLLAR }] });
    const result = await runArena(options(m));
    expect(result.cells[0]?.budgetUsd).toBeUndefined();
    expect(result.cells[0]?.run.stoppedEarly).toBe(false);
    expect(result.spentUsd).toBe(3);
  });

  it('carries calls per use into the forecast', async () => {
    const m = matrix({
      callsPerUse: 2,
      usesPerMonth: [1_000],
      cells: [{ provider: 'openai', model: 'a', pricing: DOLLAR }],
    });
    const result = await runArena(options(m));
    expect(result.cells[0]?.forecast.callsPerUse).toBe(2);
    expect(result.cells[0]?.forecast.rows[0]?.monthlyUsd).toBe(2_000);
  });
});

describe('renderArenaMarkdown', () => {
  const meta = { date: '2025-10-09', promptVersion: 'p1', setVersion: 's1', catalogVersion: 'c1' };

  it('renders a scorecard row per cell with forecast columns', async () => {
    const m = matrix({
      budgetUsd: 1,
      usesPerMonth: [25_000, 50_000],
      monthlyCapUsd: 500,
      cells: [
        { label: 'a|b', provider: 'openai', model: 'gpt-5-mini', effort: 'low', pricing: DOLLAR },
        { label: 'later', provider: 'openai', model: 'x', pricing: DOLLAR },
        { provider: 'gemini', model: 'g', pricing: FREE, enabled: false, note: 'pending | IT' },
      ],
    });
    const md = renderArenaMarkdown({ ...meta, matrixVersion: 'm1' }, await runArena(options(m)));
    expect(md).toContain('# Model arena: 2025-10-09');
    expect(md).toContain('matrix `m1`');
    expect(md).toContain('of a $1.00 global cap');
    expect(md).toMatch(/\| Cell \| Provider \/ model \/ effort \| Cases \|/);
    expect(md).toContain('$/mo @ 25,000');
    expect(md).toContain('$/mo @ 50,000');
    expect(md).toContain('| a\\|b | openai / gpt-5-mini / low |');
    expect(md).toContain('## Stopped at the cap');
    expect(md).toContain('## Skipped cells');
    expect(md).toContain('- later: global cap reached');
    expect(md).toContain('- gemini/g: pending \\| IT');
    expect(md).not.toContain('secret pantry');
  });

  it('says so when nothing ran', async () => {
    const m = matrix({
      cells: [{ provider: 'openai', model: 'x', pricing: FREE, enabled: false }],
    });
    const md = renderArenaMarkdown(meta, await runArena(options(m)));
    expect(md).toContain('No cells ran.');
    expect(md).toContain('(no global cap)');
    expect(md).not.toContain('| Cell |');
  });
});
