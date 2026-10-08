import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { catalogFromData } from '../catalog';
import { loadConfig, PROVIDERS, type ProviderName } from '../config';
import { createProvider } from '../extract';
import { promptVersions } from '../extract/prompt';
import { loadLabeledSet } from './labeled-set';
import { meetsTargets, type Pricing } from './metrics';
import { renderMarkdown, type RunMeta } from './report';
import { runEval } from './runner';

const DEFAULT_SET = fileURLToPath(
  new URL('../../../../eval/sets/v0-synthetic.json', import.meta.url),
);
const DEFAULT_OUT = fileURLToPath(new URL('../../../../eval', import.meta.url));
const FIXTURE_CATALOG = new URL('../fixtures/catalog.json', import.meta.url);

const USAGE = `Usage: pnpm eval [options]

Runs the labeled set through the extraction + matching path and scores it (TDD §7.9, PROOF_DOC P9).
Defaults come from the same env as the service (AI_PROVIDER, AI_MODEL, PROMPT_VERSION, ANTHROPIC_API_KEY).

Options:
  --provider <name>    ${PROVIDERS.join(' | ')}
  --model <id>         Model id passed to the provider
  --prompt <version>   Prompt version (${promptVersions().join(', ')})
  --set <file>         Labeled set (default: eval/sets/v0-synthetic.json)
  --budget <usd>       Stop before the next case once spend reaches this
  --price-in <usd>     USD per million input tokens (required for live providers)
  --price-out <usd>    USD per million output tokens (required for live providers)
  --out <dir>          Writes runs/<stamp>.json (git-ignored) and reports/<stamp>.md (default: eval/)
  --strict             Exit 1 when the run misses the G2 bar
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

function checkProvider(name: ProviderName, apiKey: string | undefined): void {
  if (name === 'anthropic' && !apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set (OPEN-2). Add it to the root .env to run a live eval.',
    );
  }
  if (name === 'openai' || name === 'bedrock') {
    throw new Error(
      `The ${name} adapter is a stub until OPEN-1 is decided. Use mock or anthropic.`,
    );
  }
}

function stamp(date: Date, provider: string, model: string): string {
  const time = date
    .toISOString()
    .replace(/[:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
  return `${time}-${provider}-${model.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')}`;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  // pnpm forwards a literal `--` (`pnpm eval -- --provider anthropic`).
  if (argv[0] === '--') argv.shift();
  const { values } = parseArgs({
    args: argv,
    options: {
      provider: { type: 'string' },
      model: { type: 'string' },
      prompt: { type: 'string' },
      set: { type: 'string' },
      budget: { type: 'string' },
      'price-in': { type: 'string' },
      'price-out': { type: 'string' },
      out: { type: 'string' },
      strict: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) {
    write(USAGE);
    return;
  }

  const config = loadConfig(process.env);
  const provider = (values.provider ?? config.provider) as ProviderName;
  if (!PROVIDERS.includes(provider))
    throw new Error(`--provider must be one of ${PROVIDERS.join(', ')}`);
  const model = values.model ?? config.model;
  const promptVersion = values.prompt ?? config.promptVersion;
  if (!promptVersions().includes(promptVersion)) {
    throw new Error(`--prompt must be one of ${promptVersions().join(', ')}`);
  }
  checkProvider(provider, config.anthropicApiKey);

  const budgetUsd = usd('budget', values.budget);
  const priceIn = usd('price-in', values['price-in']);
  const priceOut = usd('price-out', values['price-out']);
  if (provider !== 'mock' && (priceIn === undefined || priceOut === undefined)) {
    throw new Error(
      'Pass --price-in and --price-out (USD per million tokens) from the provider price list.',
    );
  }
  const pricing: Pricing = { inputPerMTok: priceIn ?? 0, outputPerMTok: priceOut ?? 0 };

  const setPath = values.set ? fromCwd(values.set) : DEFAULT_SET;
  const set = await loadLabeledSet(setPath);
  const { catalogVersion, matcher } = catalogFromData(
    JSON.parse(await readFile(FIXTURE_CATALOG, 'utf8')),
  );

  write(
    `eval: ${set.cases.length} cases from ${set.version}, ${provider}/${model}, prompt ${promptVersion}`,
  );
  const run = await runEval({
    set,
    setPath,
    provider: createProvider(provider, { anthropicApiKey: config.anthropicApiKey }),
    model,
    promptVersion,
    timeoutMs: config.modelTimeoutMs,
    matcher,
    pricing,
    ...(budgetUsd === undefined ? {} : { budgetUsd }),
  });

  const date = new Date();
  const meta: RunMeta = {
    date: date.toISOString(),
    provider,
    model,
    promptVersion,
    setVersion: set.version,
    catalogVersion,
    ...(budgetUsd === undefined ? {} : { budgetUsd }),
  };
  const outDir = values.out ? fromCwd(values.out) : DEFAULT_OUT;
  const name = stamp(date, provider, model);
  const jsonPath = join(outDir, 'runs', `${name}.json`);
  const mdPath = join(outDir, 'reports', `${name}.md`);
  await mkdir(join(outDir, 'runs'), { recursive: true });
  await mkdir(join(outDir, 'reports'), { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify({ meta, ...run }, null, 2)}\n`);
  await writeFile(mdPath, renderMarkdown(meta, run));

  const { overall } = run.report;
  const ok = meetsTargets(overall);
  write(
    `precision ${overall.precision.toFixed(3)}, recall ${overall.recall.toFixed(3)}, ` +
      `injection ${overall.injectionPassRate === null ? 'n/a' : overall.injectionPassRate.toFixed(3)}, ` +
      `passed ${overall.passed}/${overall.cases}, p95 ${overall.latencyP95Ms} ms, cost $${overall.costUsd.toFixed(4)}`,
  );
  if (run.stoppedEarly) write(`stopped early on budget: ${run.skipped} case(s) not run`);
  write(`${ok ? 'meets' : 'misses'} the G2 bar`);
  write(`wrote ${relative(base, jsonPath)} and ${relative(base, mdPath)}`);
  if (values.strict && !ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
