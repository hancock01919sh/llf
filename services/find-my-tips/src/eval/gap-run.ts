import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isAbsolute, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { staticCatalogSource } from '../catalog';
import { loadConfig } from '../config';
import { createProvider } from '../extract';
import { promptVersions } from '../extract/prompt';
import { runGapSet } from './gap-runner';
import { loadGapSet } from './gap-set';

const USAGE = `Usage: pnpm eval:gaps [options]

Runs the ground-truth gap set through classifyGapTerms + filterGapTerms and reports
personal-data leaks (D35 / TDD §7.8). This measures the gap step in isolation; the main
eval runner measures extraction + matching.

Options:
  --provider <name>    mock | anthropic | openai | gemini (from env default)
  --model <id>         Model id (from AI_MODEL)
  --prompt <version>   Prompt version (${promptVersions().join(', ')})
  --set <file>         Gap set (default: eval/sets/gaps-v1.json)
  --catalog <file>     Catalog to run against (default: the bundled fixture catalog)
  --out <dir>          Directory for runs/<stamp>.json and reports/<stamp>.md
  --strict             Exit 1 when any personal leak is found OR when any expected kept term is wrong
  -h, --help           Show this message
`;

const write = (line: string): void => {
  process.stdout.write(`${line}\n`);
};
const base = process.env.INIT_CWD ?? process.cwd();
const fromCwd = (path: string): string => (isAbsolute(path) ? path : resolve(base, path));

function formatDate(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function renderGapMarkdown(run: Awaited<ReturnType<typeof runGapSet>>, setVersion: string): string {
  const s = run.summary;
  const verdict = s.perfectPass
    ? '✅ every case passed'
    : s.privacyPassed
      ? '✅ privacy bar met (0 leaks)'
      : '❌ personal-data leak(s) — does not meet D35';

  const lines: string[] = [
    `# Gap eval: ${run.provider}/${run.model} (${run.date})`,
    '',
    `- Set: \`${setVersion}\`, catalog \`${run.catalogVersion}\`, prompt \`${run.promptVersion}\``,
    `- Cases: ${s.cases}`,
    `- Personal leaks: **${s.leakedTerms}** across ${s.leakedCases} case(s) ${s.leakedCases === 0 ? '(✅ D35 bar)' : '(❌ D35 bar FAIL)'}`,
    `- Expected terms missing from kept: ${s.missingKept}`,
    `- Non-personal wrong class: ${s.wrongClass}`,
    `- Class accuracy on edible/inedible/compostable: ${s.classAccuracy === null ? '—' : (s.classAccuracy * 100).toFixed(1) + '%'}`,
    '',
    `## Verdict: ${verdict}`,
    '',
  ];

  if (s.cases > 0) {
    lines.push('## Per-case', '', '| Case | Leaks | Missing | Wrong class | Latency |', '|---|---|---|---|---|');
    for (const result of run.results) {
      const leakCell = result.leaks.length === 0 ? '—' : `**${result.leaks.join(', ')}**`;
      const missingCell = result.missing.length === 0 ? '—' : result.missing.join(', ');
      const wrongCell = result.wrongClass.length === 0 ? '—' : result.wrongClass.join(', ');
      lines.push(
        `| \`${result.id}\` | ${leakCell} | ${missingCell} | ${wrongCell} | ${result.latencyMs} ms |`,
      );
    }
    lines.push('');

    const wrongCases = run.results.filter(
      (r) => r.leaks.length > 0 || r.missing.length > 0 || r.wrongClass.length > 0 || r.error,
    );
    if (wrongCases.length > 0) {
      lines.push('## Model classification (problem cases)', '');
      for (const result of wrongCases) {
        lines.push(`### ${result.id}`, '');
        if (result.error) {
          lines.push(`_classifyGapTerms error: ${result.error}_`, '');
          continue;
        }
        lines.push('| Term | Expected | Model | Kept |', '|---|---|---|---|');
        for (const row of result.model) {
          const kept = result.kept.find((k) =>
            k.name.toLowerCase().replace(/\s+/g, ' ') === row.term.toLowerCase().replace(/\s+/g, ' '),
          );
          const keptCell = kept ? `${kept.class}` : '—';
          let marker = '';
          if (row.expected === 'exclude') {
            if (row.modelClass !== 'exclude') marker = ' ❌';
          } else if (row.expected !== 'personal') {
            if (row.modelClass !== row.expected) marker = ' ❌';
          }
          lines.push(`| \`${row.term}\` | ${row.expected} | ${row.modelClass}${marker} | ${keptCell} |`);
        }
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

export async function main(argv: string[]): Promise<number> {
  // `pnpm eval:gaps -- --provider mock` forwards the separator verbatim.
  const args = argv[0] === '--' ? argv.slice(1) : argv;
  const { values } = parseArgs({
    args,
    options: {
      provider: { type: 'string' },
      model: { type: 'string' },
      prompt: { type: 'string' },
      set: { type: 'string' },
      catalog: { type: 'string' },
      out: { type: 'string' },
      strict: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
  });

  if (values.help) {
    write(USAGE);
    return 0;
  }

  const config = loadConfig({
    ...process.env,
    ...(values.provider ? { AI_PROVIDER: values.provider } : {}),
    ...(values.model ? { AI_MODEL: values.model } : {}),
    ...(values.prompt ? { PROMPT_VERSION: values.prompt } : {}),
  });
  const setPath = fromCwd(
    values.set ?? fileURLToPath(new URL('../../../../eval/sets/gaps-v1.json', import.meta.url)),
  );
  const catalogPath = fromCwd(
    values.catalog ??
      fileURLToPath(new URL('../fixtures/catalog.json', import.meta.url)),
  );
  const outDir = fromCwd(
    values.out ?? fileURLToPath(new URL('../../../../eval', import.meta.url)),
  );
  const strict = Boolean(values.strict);

  const provider = createProvider(config.provider);
  if (!provider.classifyGaps) {
    write(`provider "${provider.name}" has no classifyGaps; aborting`);
    return 1;
  }

  const set = await loadGapSet(setPath);
  const catalog = staticCatalogSource(JSON.parse(await readFile(catalogPath, 'utf8')));

  write(
    `gap eval: ${set.cases.length} cases from ${set.version}, ${provider.name}/${config.model}`,
  );
  const run = await runGapSet(set, { provider, model: config.model, catalog });

  const stamp = formatDate();
  const runsDir = resolve(outDir, 'runs');
  const reportsDir = resolve(outDir, 'reports');
  await mkdir(runsDir, { recursive: true });
  await mkdir(reportsDir, { recursive: true });
  const runPath = resolve(runsDir, `${stamp}-${provider.name}-${config.model}.json`);
  const reportPath = resolve(reportsDir, `${stamp}-${provider.name}-${config.model}.md`);
  await writeFile(runPath, JSON.stringify(run, null, 2));
  await writeFile(reportPath, renderGapMarkdown(run, set.version));

  const s = run.summary;
  write(
    `leaks ${s.leakedTerms} (${s.leakedCases} case${s.leakedCases === 1 ? '' : 's'}), ` +
      `class accuracy ${s.classAccuracy === null ? 'n/a' : (s.classAccuracy * 100).toFixed(1) + '%'}, ` +
      `passed ${s.passed}/${s.cases}`,
  );
  write(`wrote ${runPath} and ${reportPath}`);

  if (strict && (!s.privacyPassed || s.wrongClass > 0 || s.missingKept > 0)) {
    write('exit 1: strict gap run did not meet privacy + class bar');
    return 1;
  }
  return 0;
}

// re-export for tests
export { renderGapMarkdown };

const entry = process.argv[1] ? resolve(process.argv[1]) : '';
if (entry === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then(
    (code) => {
      if (code !== 0) process.exitCode = code;
    },
    (error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    },
  );
}
