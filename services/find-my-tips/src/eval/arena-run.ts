import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { catalogFromData } from '../catalog';
import { loadConfig, type ProviderName } from '../config';
import { createProvider } from '../extract';
import { promptVersions } from '../extract/prompt';
import {
  ArenaMatrix,
  cellLabel,
  missingFor,
  PROPOSED_PROVIDERS,
  renderArenaMarkdown,
  runArena,
  type ArenaCell,
  type ArenaMeta,
  type ProviderChoice,
} from './arena';
import { loadLabeledSet } from './labeled-set';
import { meetsTargets } from './metrics';

const DEFAULT_MATRIX = fileURLToPath(
  new URL('../../../../eval/arena.example.json', import.meta.url),
);
const DEFAULT_SET = fileURLToPath(
  new URL('../../../../eval/sets/v0-synthetic.json', import.meta.url),
);
const DEFAULT_OUT = fileURLToPath(new URL('../../../../eval', import.meta.url));
const FIXTURE_CATALOG = new URL('../fixtures/catalog.json', import.meta.url);

const USAGE = `Usage: pnpm arena [options]

Runs the labeled set through every enabled cell of a provider × model × effort matrix and
writes one scorecard (BD3244-37, TDD §7.7, OPEN-1). Cells without a key are skipped, not failed.
Keys come from the same env as the service (ANTHROPIC_API_KEY, OPENAI_API_KEY).

Options:
  --matrix <file>      Arena matrix (default: eval/arena.example.json)
  --set <file>         Labeled set (default: the matrix setPath, else eval/sets/v0-synthetic.json)
  --prompt <version>   Prompt version (${promptVersions().join(', ')})
  --budget <usd>       Global spend cap across all cells (overrides the matrix budgetUsd)
  --out <dir>          Writes runs/arena-<stamp>.json (git-ignored) and reports/arena-<stamp>.md (default: eval/)
  --dry-run            List the cells and why any would be skipped, without calling a model
  -h, --help           Show this message
`;

const write = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const base = process.env.INIT_CWD ?? process.cwd();
const fromCwd = (path: string): string => (isAbsolute(path) ? path : resolve(base, path));

function usd(flag: string, value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0)
    throw new Error(`--${flag} must be a non-negative number`);
  return parsed;
}

function stamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  // pnpm forwards a literal `--` (`pnpm arena -- --dry-run`).
  if (argv[0] === '--') argv.shift();
  const { values } = parseArgs({
    args: argv,
    options: {
      matrix: { type: 'string' },
      set: { type: 'string' },
      prompt: { type: 'string' },
      budget: { type: 'string' },
      out: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) {
    write(USAGE);
    return;
  }

  const config = loadConfig(process.env);
  const promptVersion = values.prompt ?? config.promptVersion;
  if (!promptVersions().includes(promptVersion)) {
    throw new Error(`--prompt must be one of ${promptVersions().join(', ')}`);
  }
  const budgetUsd = usd('budget', values.budget);

  const matrixPath = values.matrix ? fromCwd(values.matrix) : DEFAULT_MATRIX;
  const matrix = ArenaMatrix.parse(JSON.parse(await readFile(matrixPath, 'utf8')));
  const setPath = values.set
    ? fromCwd(values.set)
    : matrix.setPath
      ? resolve(dirname(matrixPath), matrix.setPath)
      : DEFAULT_SET;
  const set = await loadLabeledSet(setPath);
  const { catalogVersion, matcher } = catalogFromData(
    JSON.parse(await readFile(FIXTURE_CATALOG, 'utf8')),
  );

  const providerFor = (cell: ArenaCell & { provider: ProviderName }): ProviderChoice => {
    const missing = missingFor(cell.provider, config);
    if (missing !== undefined) return { skip: missing };
    return createProvider(cell.provider, {
      anthropicApiKey: config.anthropicApiKey,
      openaiApiKey: config.openaiApiKey,
    });
  };

  const cap = budgetUsd ?? matrix.budgetUsd;
  write(
    `arena: ${matrix.cells.length} cell(s), ${set.cases.length} cases from ${set.version}, prompt ${promptVersion}` +
      (cap === undefined ? ', no global cap' : `, global cap $${cap.toFixed(2)}`),
  );

  if (values['dry-run']) {
    for (const cell of matrix.cells) {
      const label = cellLabel(cell);
      const proposed = (PROPOSED_PROVIDERS as readonly string[]).includes(cell.provider);
      const reason =
        !cell.enabled || proposed
          ? (cell.note ?? 'disabled in the matrix')
          : missingFor(cell.provider as ProviderName, config);
      const capNote = cell.budgetUsd === undefined ? '' : ` (cap $${cell.budgetUsd.toFixed(2)})`;
      write(
        `  ${reason === undefined ? 'run ' : 'skip'} ${label}${capNote}${reason ? `: ${reason}` : ''}`,
      );
    }
    return;
  }

  const result = await runArena({
    matrix,
    set,
    setPath,
    matcher,
    promptVersion,
    timeoutMs: config.modelTimeoutMs,
    ...(budgetUsd === undefined ? {} : { budgetUsd }),
    providerFor,
  });

  const date = new Date();
  const meta: ArenaMeta = {
    date: date.toISOString(),
    promptVersion,
    setVersion: set.version,
    catalogVersion,
    ...(matrix.version === undefined ? {} : { matrixVersion: matrix.version }),
  };
  const outDir = values.out ? fromCwd(values.out) : DEFAULT_OUT;
  const name = `arena-${stamp(date)}`;
  const jsonPath = join(outDir, 'runs', `${name}.json`);
  const mdPath = join(outDir, 'reports', `${name}.md`);
  await mkdir(join(outDir, 'runs'), { recursive: true });
  await mkdir(join(outDir, 'reports'), { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify({ meta, matrix, ...result }, null, 2)}\n`);
  await writeFile(mdPath, renderArenaMarkdown(meta, result));

  for (const { label, run } of result.cells) {
    const s = run.report.overall;
    write(
      `  ${meetsTargets(s) ? 'meets ' : 'misses'} ${label}: precision ${s.precision.toFixed(3)}, ` +
        `recall ${s.recall.toFixed(3)}, $${s.costPerCallUsd.toFixed(5)}/call` +
        (run.stoppedEarly ? `, stopped at cap with ${run.skipped} left` : ''),
    );
  }
  for (const s of result.skipped) write(`  skipped ${s.label}: ${s.reason}`);
  write(`spent $${result.spentUsd.toFixed(4)}`);
  write(`wrote ${relative(base, jsonPath)} and ${relative(base, mdPath)}`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
