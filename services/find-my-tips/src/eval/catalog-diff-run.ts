import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { Catalog } from '@llf/contracts/catalog';

import { catalogFromExport, diffCatalogs, relabelSet, renderCatalogDiff } from './catalog-diff';
import { loadLabeledSet } from './labeled-set';

const DEFAULT_OUT = fileURLToPath(new URL('../../../../eval', import.meta.url));
const DEFAULT_EVAL = fileURLToPath(
  new URL('../../../../eval/catalogs/eval-v2.json', import.meta.url),
);

const USAGE = `Usage: pnpm catalog-diff --cms <export.json> [--eval <catalog.json>] [--relabel <set.json> ...] [--out <dir>]

Carries the eval vocabulary over to the real CMS catalog (OPEN-8/13/30). Maps every eval
ingredient onto a CMS slug through the production matcher and reports synonyms to add,
ingredients the CMS splits or lacks, and slug changes. With --relabel, also writes copies of
the labeled sets on CMS slugs, ready for \`pnpm rescore\`. No model is called.

Options:
  --cms <file>       CMS export: published catalog JSON, seed fixture, or Strapi REST response
  --cms-version <v>  Version label when the export has none (default: cms)
  --eval <file>      Eval catalog (default: eval/catalogs/eval-v2.json)
  --relabel <file>   Labeled set to rewrite onto CMS slugs (repeatable)
  --out <dir>        Writes reports/catalog-diff-<cms>.md, catalogs/<cms>.json and
                     sets/<set>-<cms>.json (default: eval/)
  -h, --help         Show this message
`;

const write = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const base = process.env.INIT_CWD ?? process.cwd();
const fromCwd = (path: string): string => (isAbsolute(path) ? path : resolve(base, path));

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv[0] === '--') argv.shift();
  const { values } = parseArgs({
    args: argv,
    options: {
      cms: { type: 'string' },
      'cms-version': { type: 'string' },
      eval: { type: 'string' },
      relabel: { type: 'string', multiple: true },
      out: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help || !values.cms) {
    write(USAGE);
    if (!values.help) process.exitCode = 1;
    return;
  }

  const evalCatalog = Catalog.parse(
    JSON.parse(await readFile(values.eval ? fromCwd(values.eval) : DEFAULT_EVAL, 'utf8')),
  );
  const cms = catalogFromExport(
    JSON.parse(await readFile(fromCwd(values.cms), 'utf8')),
    values['cms-version'] ?? 'cms',
  );
  const diff = diffCatalogs(evalCatalog, cms);

  const outDir = values.out ? fromCwd(values.out) : DEFAULT_OUT;
  await mkdir(join(outDir, 'reports'), { recursive: true });
  await mkdir(join(outDir, 'catalogs'), { recursive: true });
  const catalogPath = join(outDir, 'catalogs', `${cms.catalogVersion}.json`);
  await writeFile(catalogPath, `${JSON.stringify(cms, null, 2)}\n`);

  let report = renderCatalogDiff(diff);
  const setsDir = join(outDir, 'sets');
  for (const path of values.relabel ?? []) {
    const setPath = fromCwd(path);
    const { set, notes } = relabelSet(await loadLabeledSet(setPath), diff);
    // Image paths are relative to the set file, so point them back at the originals.
    for (const item of set.cases) {
      if (item.imagePath) {
        item.imagePath = relative(setsDir, resolve(dirname(setPath), item.imagePath));
      }
    }
    await mkdir(setsDir, { recursive: true });
    const setOut = join(setsDir, `${basename(setPath, '.json')}-${cms.catalogVersion}.json`);
    await writeFile(setOut, `${JSON.stringify(set, null, 2)}\n`);
    report += [
      '',
      `## Relabeled \`${basename(setPath)}\``,
      '',
      notes.length === 0
        ? 'Every label carried over unchanged.'
        : `${notes.length} case(s) need a look:\n\n| Case | Dropped (no CMS counterpart) | Split by the CMS |\n|---|---|---|\n` +
          notes
            .map((n) => `| \`${n.caseId}\` | ${n.dropped.join(', ')} | ${n.split.join(', ')} |`)
            .join('\n'),
      '',
    ].join('\n');
    write(`wrote ${relative(base, setOut)} (${notes.length} case(s) flagged)`);
  }

  const mdPath = join(outDir, 'reports', `catalog-diff-${cms.catalogVersion}.md`);
  await writeFile(mdPath, report);
  const mapped = diff.ingredients.filter((d) => d.cmsSlug !== null).length;
  write(
    `${mapped}/${diff.ingredients.length} eval ingredients map onto CMS ${cms.catalogVersion}; ` +
      `${diff.ingredients.reduce((n, d) => n + d.missing.length, 0)} terms to add as synonyms`,
  );
  write(`wrote ${relative(base, mdPath)} and ${relative(base, catalogPath)}`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
