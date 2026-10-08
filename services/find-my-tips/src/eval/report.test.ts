import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { catalogFromData } from '../catalog';
import { createMockProvider } from '../extract';
import type { ExtractionProvider } from '../extract';
import { LabeledSet } from './labeled-set';
import type { RunMeta } from './report';
import { renderMarkdown } from './report';
import { runEval } from './runner';

const fixture: unknown = JSON.parse(
  readFileSync(new URL('../fixtures/catalog.json', import.meta.url), 'utf8'),
);
const { catalogVersion, matcher } = catalogFromData(fixture);

const META: RunMeta = {
  date: '2025-10-01',
  provider: 'mock',
  model: 'mock-model',
  promptVersion: 'v1',
  setVersion: 't',
  catalogVersion,
};

const SECRET_TEXT = 'bananas, whole milk';

async function run(
  cases: unknown[],
  provider: ExtractionProvider = createMockProvider(),
  budgetUsd?: number,
) {
  let t = 0;
  return runEval({
    set: LabeledSet.parse({ version: 't', cases }),
    setPath: fileURLToPath(new URL('./set.json', import.meta.url)),
    provider,
    model: 'mock-model',
    promptVersion: 'v1',
    timeoutMs: 1000,
    matcher,
    pricing: { inputPerMTok: 1, outputPerMTok: 0 },
    now: () => (t += 5),
    ...(budgetUsd === undefined ? {} : { budgetUsd }),
  });
}

function textCase(id: string, expectedSlugs: string[]) {
  return {
    id,
    kind: 'text',
    text: SECRET_TEXT,
    detectedType: 'shopping_list',
    expectedReadable: true,
    expectedSlugs,
  };
}

describe('renderMarkdown', () => {
  it('reports a passing run without echoing case text', async () => {
    const md = renderMarkdown(META, await run([textCase('groceries', ['banana', 'milk'])]));
    expect(md).toContain('# P9 eval: mock-model (2025-10-01)');
    expect(md).toContain('## Result: ✅ meets the G2 bar');
    expect(md).toContain('`groceries`');
    expect(md).toContain('## By input kind');
    expect(md).toContain('## By detected type');
    expect(md).not.toContain(SECRET_TEXT);
    expect(md).not.toContain('budget');
  });

  it('reports a failing run with missing slugs', async () => {
    const md = renderMarkdown(META, await run([textCase('short', ['banana', 'milk', 'spinach'])]));
    expect(md).toContain('## Result: ❌ misses the G2 bar');
    expect(md).toMatch(/\| `short` \| ❌ \|.*spinach/);
  });

  it('flags a run that stopped on budget', async () => {
    const provider: ExtractionProvider = {
      name: 'pricey',
      extract: () =>
        Promise.resolve({
          result: {
            readable: true,
            detectedType: 'shopping_list',
            items: [{ term: 'bananas', isFood: true, inferred: false }],
          },
          usage: { inputTokens: 1_000_000, outputTokens: 0 },
        }),
    };
    const result = await run([textCase('a', ['banana']), textCase('b', ['banana'])], provider, 1);
    const md = renderMarkdown({ ...META, budgetUsd: 1 }, result);
    expect(md).toContain('cost $1.0000 of $1.0000 budget');
    expect(md).toContain('- **Stopped early on budget: 1 case(s) not run.**');
  });
});
