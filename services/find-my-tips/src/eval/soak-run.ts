import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { loadConfig, PROVIDERS, type ProviderName } from '../config';
import { createProvider } from '../extract';
import { promptVersions } from '../extract/prompt';
import { REASONING_EFFORTS, type ExtractionInput, type ReasoningEffort } from '../extract/types';
import { caseInput, loadLabeledSet } from './labeled-set';
import {
  renderSoakMarkdown,
  runSoak,
  SOAK_PRESETS,
  stageCalls,
  summarizeSoak,
  validatePlan,
  type SoakMeta,
} from './soak';

const DEFAULT_SET = fileURLToPath(new URL('../../../../eval/sets/v2-mixed.json', import.meta.url));
const DEFAULT_OUT = fileURLToPath(new URL('../../../../eval', import.meta.url));

const USAGE = `Usage: pnpm soak [options]

Provider soak / load test (BD3244-37): replays labeled images at a fixed rate or concurrency and
reports first-attempt vs final error rates, latency, throughput and cost per stage. Retries are
eval-only (429/500/502/503/504) and show what a retry policy WOULD buy. Keys come from the root .env.

Options:
  --provider <name>        ${PROVIDERS.join(', ')} (default: AI_PROVIDER)
  --model <id>             Model id (default: AI_MODEL)
  --effort <level>         ${REASONING_EFFORTS.join(', ')}
  --prompt <version>       Prompt version (${promptVersions().join(', ')})
  --set <file>             Labeled set; readable image cases only (default: eval/sets/v2-mixed.json)
  --plan <file>            JSON array of stages: {name, concurrency, calls} or {name, ratePerSec, durationSec}
  --preset <name>          ${Object.keys(SOAK_PRESETS).join(', ')} (default: smoke)
  --retries <n>            Max retries per call (default 0)
  --retry-base-ms <ms>     Backoff base (default 1000)
  --input-per-mtok <usd>   Input price per million tokens (default 0)
  --output-per-mtok <usd>  Output price per million tokens (default 0)
  --budget <usd>           Hard stop: no new calls once spend reaches this
  --out <dir>              Writes runs/soak-<stamp>.json and reports/soak-<stamp>.md (default: eval/)
  --dry-run                Print the plan without calling a model
  -h, --help               Show this message
`;

const write = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const base = process.env.INIT_CWD ?? process.cwd();
const fromCwd = (path: string): string => (isAbsolute(path) ? path : resolve(base, path));

function num(flag: string, value: string | undefined, fallback?: number): number | undefined {
  if (value === undefined) return fallback;
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
  if (argv[0] === '--') argv.shift();
  const { values } = parseArgs({
    args: argv,
    options: {
      provider: { type: 'string' },
      model: { type: 'string' },
      effort: { type: 'string' },
      prompt: { type: 'string' },
      set: { type: 'string' },
      plan: { type: 'string' },
      preset: { type: 'string' },
      retries: { type: 'string' },
      'retry-base-ms': { type: 'string' },
      'input-per-mtok': { type: 'string' },
      'output-per-mtok': { type: 'string' },
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
  const providerName = (values.provider ?? config.provider) as ProviderName;
  if (!(PROVIDERS as readonly string[]).includes(providerName)) {
    throw new Error(`--provider must be one of ${PROVIDERS.join(', ')}`);
  }
  const model = values.model ?? config.model;
  const promptVersion = values.prompt ?? config.promptVersion;
  if (!promptVersions().includes(promptVersion)) {
    throw new Error(`--prompt must be one of ${promptVersions().join(', ')}`);
  }
  if (values.effort && !(REASONING_EFFORTS as readonly string[]).includes(values.effort)) {
    throw new Error(`--effort must be one of ${REASONING_EFFORTS.join(', ')}`);
  }
  const effort = values.effort as ReasoningEffort | undefined;

  let plan;
  if (values.plan) {
    plan = validatePlan(JSON.parse(await readFile(fromCwd(values.plan), 'utf8')));
  } else {
    const name = values.preset ?? 'smoke';
    plan = SOAK_PRESETS[name];
    if (!plan) throw new Error(`--preset must be one of ${Object.keys(SOAK_PRESETS).join(', ')}`);
  }
  const retries = {
    max: Math.floor(num('retries', values.retries, 0) ?? 0),
    baseDelayMs: num('retry-base-ms', values['retry-base-ms'], 1000) ?? 1000,
  };
  const pricing = {
    inputPerMTok: num('input-per-mtok', values['input-per-mtok'], 0) ?? 0,
    outputPerMTok: num('output-per-mtok', values['output-per-mtok'], 0) ?? 0,
  };
  const budgetUsd = num('budget', values.budget);

  const setPath = values.set ? fromCwd(values.set) : DEFAULT_SET;
  const set = await loadLabeledSet(setPath);
  const cases = set.cases.filter((item) => item.kind === 'image' && item.expectedReadable);
  if (cases.length === 0) throw new Error('the set has no readable image cases');

  const total = plan.reduce((sum, stage) => sum + stageCalls(stage), 0);
  write(
    `soak: ${providerName}/${model}${effort ? `/${effort}` : ''}, prompt ${promptVersion}, ${plan.length} stage(s), ${total} calls, ` +
      `${cases.length} image inputs from ${set.version}, retries ${retries.max}` +
      (budgetUsd === undefined ? '' : `, budget $${budgetUsd.toFixed(2)}`),
  );
  if (values['dry-run']) {
    for (const stage of plan) write(`  ${JSON.stringify(stage)} -> ${stageCalls(stage)} calls`);
    return;
  }

  const inputs: ExtractionInput[] = [];
  for (const item of cases) inputs.push(await caseInput(item, setPath));

  const provider = createProvider(providerName, {
    anthropicApiKey: config.anthropicApiKey,
    openaiApiKey: config.openaiApiKey,
    geminiApiKey: config.geminiApiKey,
  });

  const run = await runSoak({
    provider,
    model,
    reasoningEffort: effort,
    promptVersion,
    timeoutMs: config.modelTimeoutMs,
    inputs,
    plan,
    pricing,
    retries,
    budgetUsd,
  });
  const summary = summarizeSoak(run.records);

  const date = new Date();
  const meta: SoakMeta = {
    date: date.toISOString(),
    provider: providerName,
    model,
    effort,
    promptVersion,
    setVersion: set.version,
    inputs: inputs.length,
    retries,
    plan,
    budgetUsd,
  };
  const outDir = values.out ? fromCwd(values.out) : DEFAULT_OUT;
  const name = `soak-${stamp(date)}`;
  const jsonPath = join(outDir, 'runs', `${name}.json`);
  const mdPath = join(outDir, 'reports', `${name}.md`);
  await mkdir(join(outDir, 'runs'), { recursive: true });
  await mkdir(join(outDir, 'reports'), { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify({ meta, run, summary }, null, 2)}\n`);
  await writeFile(mdPath, renderSoakMarkdown(meta, run, summary));

  for (const s of summary) {
    write(
      `  ${s.stage}: ${s.ok}/${s.calls} ok, errors first ${(s.firstAttemptErrorRate * 100).toFixed(1)}% final ${(s.finalErrorRate * 100).toFixed(1)}%, ` +
        `p50 ${s.latencyP50Ms} ms p95 ${s.latencyP95Ms} ms, ${s.throughputPerSec.toFixed(2)} calls/s, $${s.costUsd.toFixed(4)}`,
    );
  }
  if (run.stoppedEarly) write(`stopped at the budget with ${run.skipped} calls skipped`);
  write(`spent $${run.spentUsd.toFixed(4)}`);
  write(`wrote ${relative(base, jsonPath)} and ${relative(base, mdPath)}`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
