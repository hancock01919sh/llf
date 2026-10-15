import { extractIngredients, type ExtractionInput, type ExtractionProvider } from '../extract';
import type { ReasoningEffort } from '../extract/types';
import { ToolError } from '../http';
import { costUsd, percentile, type Pricing } from './metrics';
import { providerStatus } from './runner';

/**
 * Provider soak / load test (BD3244-37). Measures error rates and limits at
 * launch volume, and what an eval-side retry policy would buy. Production has
 * no model retry today. Records hold no input bytes and no model output.
 */

export type ClosedStage = { name: string; concurrency: number; calls: number };
export type OpenStage = { name: string; ratePerSec: number; durationSec: number };
export type SoakStage = ClosedStage | OpenStage;
export type SoakPlan = SoakStage[];

export const MAX_IN_FLIGHT = 64;
export const RETRY_STATUSES: readonly number[] = [429, 500, 502, 503, 504];

export const SOAK_PRESETS: Record<string, SoakPlan> = {
  launch: [
    { name: 'steady', ratePerSec: 0.05, durationSec: 120 },
    { name: 'peak', ratePerSec: 0.5, durationSec: 120 },
    { name: 'burst-8', concurrency: 8, calls: 48 },
    { name: 'burst-16', concurrency: 16, calls: 64 },
    { name: 'burst-32', concurrency: 32, calls: 96 },
  ],
  smoke: [{ name: 'smoke', concurrency: 2, calls: 4 }],
};

export function isOpenStage(stage: SoakStage): stage is OpenStage {
  return 'ratePerSec' in stage;
}

export function stageCalls(stage: SoakStage): number {
  return isOpenStage(stage)
    ? Math.max(1, Math.round(stage.ratePerSec * stage.durationSec))
    : stage.calls;
}

export function validatePlan(plan: unknown): SoakPlan {
  if (!Array.isArray(plan) || plan.length === 0) throw new Error('plan must be a non-empty array');
  return plan.map((raw: unknown, index) => {
    const stage = raw as Record<string, unknown>;
    const name = typeof stage.name === 'string' && stage.name ? stage.name : `stage-${index + 1}`;
    const positive = (key: string): number => {
      const value = stage[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        throw new Error(`plan stage "${name}": ${key} must be a positive number`);
      }
      return value;
    };
    if ('ratePerSec' in stage) {
      return { name, ratePerSec: positive('ratePerSec'), durationSec: positive('durationSec') };
    }
    return {
      name,
      concurrency: Math.floor(positive('concurrency')),
      calls: Math.floor(positive('calls')),
    };
  });
}

export type SoakRecord = {
  stage: string;
  startedAtMs: number;
  latencyMs: number;
  outcome: string;
  providerStatus?: number;
  attempts: number;
  firstOutcome: string;
  firstProviderStatus?: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type SoakOptions = {
  provider: ExtractionProvider;
  model: string;
  reasoningEffort?: ReasoningEffort | undefined;
  promptVersion: string;
  timeoutMs: number;
  inputs: readonly ExtractionInput[];
  plan: SoakPlan;
  pricing: Pricing;
  retries: { max: number; baseDelayMs: number };
  budgetUsd?: number | undefined;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  onRecord?: (record: SoakRecord) => void;
};

export type SoakRun = {
  records: SoakRecord[];
  spentUsd: number;
  stoppedEarly: boolean;
  skipped: number;
  /** Highest number of calls in flight at once. */
  peakInFlight: number;
};

const realSleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

function describe(error: unknown): { outcome: string; status?: number } {
  if (error instanceof ToolError) {
    const status = providerStatus(error.cause);
    return { outcome: error.code, ...(status === undefined ? {} : { status }) };
  }
  const status = providerStatus(error);
  return { outcome: 'error', ...(status === undefined ? {} : { status }) };
}

export async function runSoak(options: SoakOptions): Promise<SoakRun> {
  const { plan, inputs, retries, pricing } = options;
  if (inputs.length === 0) throw new Error('soak needs at least one input');
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? realSleep;
  const random = options.random ?? Math.random;

  const records: SoakRecord[] = [];
  let spentUsd = 0;
  let skipped = 0;
  let stoppedEarly = false;
  let inFlight = 0;
  let peakInFlight = 0;
  let issued = 0;
  const t0 = now();

  const overBudget = (): boolean =>
    options.budgetUsd !== undefined && spentUsd >= options.budgetUsd;

  async function oneCall(stage: string, input: ExtractionInput): Promise<void> {
    inFlight += 1;
    peakInFlight = Math.max(peakInFlight, inFlight);
    const startedAt = now();
    let attempts = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let first: { outcome: string; status?: number } | undefined;
    let last: { outcome: string; status?: number } = { outcome: 'ok' };
    try {
      for (;;) {
        attempts += 1;
        try {
          const extraction = await extractIngredients(options.provider, input, {
            timeoutMs: options.timeoutMs,
            model: options.model,
            promptVersion: options.promptVersion,
            ...(options.reasoningEffort ? { reasoningEffort: options.reasoningEffort } : {}),
          });
          inputTokens += extraction.usage?.inputTokens ?? 0;
          outputTokens += extraction.usage?.outputTokens ?? 0;
          last = { outcome: 'ok' };
          first ??= last;
          break;
        } catch (error) {
          last = describe(error);
          first ??= last;
          const retryable = last.status !== undefined && RETRY_STATUSES.includes(last.status);
          if (!retryable || attempts > retries.max) break;
          await sleep(random() * retries.baseDelayMs * 2 ** (attempts - 1));
        }
      }
    } finally {
      inFlight -= 1;
    }
    const cost = costUsd(inputTokens, outputTokens, pricing);
    spentUsd += cost;
    const record: SoakRecord = {
      stage,
      startedAtMs: startedAt - t0,
      latencyMs: now() - startedAt,
      outcome: last.outcome,
      ...(last.status === undefined ? {} : { providerStatus: last.status }),
      attempts,
      firstOutcome: first?.outcome ?? last.outcome,
      ...(first?.status === undefined ? {} : { firstProviderStatus: first.status }),
      inputTokens,
      outputTokens,
      costUsd: cost,
    };
    records.push(record);
    options.onRecord?.(record);
  }

  const nextInput = (): ExtractionInput => inputs[issued++ % inputs.length] as ExtractionInput;

  for (const stage of plan) {
    const total = stageCalls(stage);
    if (stoppedEarly) {
      skipped += total;
      continue;
    }
    let launched = 0;
    if (isOpenStage(stage)) {
      const pending = new Set<Promise<void>>();
      const stageStart = now();
      for (let i = 0; i < total; i += 1) {
        const due = stageStart + (i * 1000) / stage.ratePerSec;
        const wait = due - now();
        if (wait > 0) await sleep(wait);
        while (inFlight >= MAX_IN_FLIGHT) await Promise.race(pending);
        if (overBudget()) {
          stoppedEarly = true;
          break;
        }
        launched += 1;
        const task: Promise<void> = oneCall(stage.name, nextInput()).finally(() =>
          pending.delete(task),
        );
        pending.add(task);
      }
      await Promise.all(pending);
    } else {
      let next = 0;
      const worker = async (): Promise<void> => {
        while (next < total) {
          if (overBudget()) {
            stoppedEarly = true;
            return;
          }
          next += 1;
          launched += 1;
          await oneCall(stage.name, nextInput());
        }
      };
      const workers = Math.min(stage.concurrency, MAX_IN_FLIGHT);
      await Promise.all(Array.from({ length: workers }, worker));
    }
    skipped += total - launched;
  }

  return { records, spentUsd, stoppedEarly, skipped, peakInFlight };
}

export type StageSummary = {
  stage: string;
  calls: number;
  ok: number;
  firstAttemptErrorRate: number;
  finalErrorRate: number;
  retriedCalls: number;
  byProviderStatus: Record<string, number>;
  byOutcome: Record<string, number>;
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyMaxMs: number;
  durationSec: number;
  throughputPerSec: number;
  costUsd: number;
};

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

/** Error counts are by first-attempt status/code, so they show what the provider returned before any retry. */
export function summarizeSoak(records: readonly SoakRecord[]): StageSummary[] {
  const stages = [...new Set(records.map((record) => record.stage))];
  return stages.map((stage) => {
    const rows = records.filter((record) => record.stage === stage);
    const byProviderStatus: Record<string, number> = {};
    const byOutcome: Record<string, number> = {};
    for (const row of rows) {
      if (row.firstOutcome !== 'ok') bump(byOutcome, row.firstOutcome);
      if (row.firstProviderStatus !== undefined)
        bump(byProviderStatus, String(row.firstProviderStatus));
    }
    const latencies = rows.map((row) => row.latencyMs);
    const start = Math.min(...rows.map((row) => row.startedAtMs));
    const end = Math.max(...rows.map((row) => row.startedAtMs + row.latencyMs));
    const durationSec = (end - start) / 1000;
    return {
      stage,
      calls: rows.length,
      ok: rows.filter((row) => row.outcome === 'ok').length,
      firstAttemptErrorRate: rows.filter((row) => row.firstOutcome !== 'ok').length / rows.length,
      finalErrorRate: rows.filter((row) => row.outcome !== 'ok').length / rows.length,
      retriedCalls: rows.filter((row) => row.attempts > 1).length,
      byProviderStatus,
      byOutcome,
      latencyP50Ms: percentile(latencies, 50),
      latencyP95Ms: percentile(latencies, 95),
      latencyMaxMs: Math.max(...latencies),
      durationSec,
      throughputPerSec: durationSec > 0 ? rows.length / durationSec : 0,
      costUsd: rows.reduce((sum, row) => sum + row.costUsd, 0),
    };
  });
}

const pct = (value: number): string => `${(value * 100).toFixed(1)}%`;
const counts = (map: Record<string, number>): string =>
  Object.entries(map)
    .map(([key, n]) => `${key}×${n}`)
    .join(', ') || '-';

export type SoakMeta = {
  date: string;
  provider: string;
  model: string;
  effort?: string | undefined;
  promptVersion: string;
  setVersion: string;
  inputs: number;
  retries: { max: number; baseDelayMs: number };
  plan: SoakPlan;
  budgetUsd?: number | undefined;
};

export function renderSoakMarkdown(meta: SoakMeta, run: SoakRun, summary: StageSummary[]): string {
  const lines = [
    `# Soak test: ${meta.provider}/${meta.model}`,
    '',
    `- Date: ${meta.date}`,
    `- Effort: ${meta.effort ?? 'default'}, prompt ${meta.promptVersion}, set ${meta.setVersion} (${meta.inputs} inputs, cycled)`,
    `- Retry policy (eval only; production has none): ${
      meta.retries.max === 0
        ? 'none'
        : `up to ${meta.retries.max} on 429/500/502/503/504, exponential backoff with full jitter from ${meta.retries.baseDelayMs} ms`
    }`,
    `- Plan: ${meta.plan
      .map((s) =>
        isOpenStage(s)
          ? `${s.name} (${s.ratePerSec}/s for ${s.durationSec}s)`
          : `${s.name} (concurrency ${s.concurrency}, ${s.calls} calls)`,
      )
      .join('; ')}`,
    `- Total cost: $${run.spentUsd.toFixed(4)}${run.stoppedEarly ? `; stopped at the $${meta.budgetUsd?.toFixed(2)} budget with ${run.skipped} calls skipped` : ''}`,
    `- Peak in flight: ${run.peakInFlight}`,
    '',
    '| Stage | Calls | OK | 1st-attempt errors | Final errors | Retried | Errors by status/code | p50 ms | p95 ms | max ms | Calls/s | Cost |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...summary.map(
      (s) =>
        `| ${s.stage} | ${s.calls} | ${s.ok} | ${pct(s.firstAttemptErrorRate)} | ${pct(s.finalErrorRate)} | ${s.retriedCalls} | ${counts({ ...s.byProviderStatus, ...(Object.keys(s.byProviderStatus).length ? {} : s.byOutcome) })} | ${s.latencyP50Ms} | ${s.latencyP95Ms} | ${s.latencyMaxMs} | ${s.throughputPerSec.toFixed(2)} | $${s.costUsd.toFixed(4)} |`,
    ),
    '',
  ];
  return lines.join('\n');
}
