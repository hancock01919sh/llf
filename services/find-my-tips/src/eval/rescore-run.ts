import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { catalogFromData } from '../catalog';
import { renderArenaMarkdown, type ArenaMeta, type ArenaResult } from './arena';
import { loadLabeledSet } from './labeled-set';
import { meetsTargets } from './metrics';
import { rescoreArena } from './rescore';

const DEFAULT_OUT = fileURLToPath(new URL('../../../../eval', import.meta.url));

const USAGE = `Usage: pnpm rescore --run <run.json> --set <set.json> --catalog <catalog.json> [--out <dir>]

Re-scores a stored arena run against another catalog (for example the real CMS catalog
once it exists, OPEN-8) or corrected labels, from the terms the model returned. No model
is called and nothing is spent. Runs from before Oct 15, 2026 don't keep those terms and
can't be re-scored.

Options:
  --run <file>       Arena run JSON (eval/runs/arena-*.json)
  --set <file>       Labeled set to score against (the run's set, or a relabeled copy)
  --catalog <file>   Catalog JSON (eval/catalogs/*.json, or a CMS export in the same shape)
  --out <dir>        Writes runs/<name>-rescored-<catalog>.json and reports/… (default: eval/)
  -h, --help         Show this message
`;

const write = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const base = process.env.INIT_CWD ?? process.cwd();
const fromCwd = (path: string): string => (isAbsolute(path) ? path : resolve(base, path));

type StoredRun = ArenaResult & { meta: ArenaMeta; matrix: unknown };

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv[0] === '--') argv.shift();
  const { values } = parseArgs({
    args: argv,
    options: {
      run: { type: 'string' },
      set: { type: 'string' },
      catalog: { type: 'string' },
      out: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help || !values.run || !values.set || !values.catalog) {
    write(USAGE);
    if (!values.help) process.exitCode = 1;
    return;
  }

  const runPath = fromCwd(values.run);
  const stored = JSON.parse(await readFile(runPath, 'utf8')) as StoredRun;
  const set = await loadLabeledSet(fromCwd(values.set));
  const { catalogVersion, matcher } = catalogFromData(
    JSON.parse(await readFile(fromCwd(values.catalog), 'utf8')),
  );

  const result = rescoreArena(stored, set, matcher);
  const meta: ArenaMeta = {
    ...stored.meta,
    setVersion: set.version,
    catalogVersion,
    rescoredFrom: basename(runPath, '.json'),
  };

  const outDir = values.out ? fromCwd(values.out) : DEFAULT_OUT;
  const name = `${basename(runPath, '.json')}-rescored-${catalogVersion}`;
  const jsonPath = join(outDir, 'runs', `${name}.json`);
  const mdPath = join(outDir, 'reports', `${name}.md`);
  await mkdir(join(outDir, 'runs'), { recursive: true });
  await mkdir(join(outDir, 'reports'), { recursive: true });
  const { cells, skipped, spentUsd, budgetUsd } = result;
  await writeFile(
    jsonPath,
    `${JSON.stringify({ meta, matrix: stored.matrix, cells, skipped, spentUsd, budgetUsd }, null, 2)}\n`,
  );
  await writeFile(mdPath, renderArenaMarkdown(meta, result));

  for (const { label, run } of result.cells) {
    const s = run.report.overall;
    write(
      `  ${meetsTargets(s) ? 'meets ' : 'misses'} ${label}: precision ${s.precision.toFixed(3)}, ` +
        `recall ${s.recall.toFixed(3)}`,
    );
  }
  write(`wrote ${relative(base, jsonPath)} and ${relative(base, mdPath)}`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
