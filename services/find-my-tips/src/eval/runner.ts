import type { ExtractionResult, ExtractSource } from '@llf/contracts/find-tips';
import type { Matcher } from '@llf/matching';

import { MemoryCacheStore, MemoryCounterStore } from '../cache';
import { extractIngredients } from '../extract';
import type { ExtractionProvider, ExtractionUsage, ReasoningEffort } from '../extract';
import { ToolError } from '../http';
import { matchItems } from '../match';
import { createQuota } from '../quota';
import { runUrlPipeline } from '../url/pipeline';
import type { Resolver, Transport } from '../url/safe-fetch';
import type { LabeledCase, LabeledSet } from './labeled-set';
import { caseInput } from './labeled-set';
import type { CaseOutcome, CaseScore, Pricing, Report } from './metrics';
import { aggregate, costUsd, scoreCase } from './metrics';

export type EvalOptions = {
  set: LabeledSet;
  /** Path of the set file; image paths resolve against its directory. */
  setPath: string;
  provider: ExtractionProvider;
  model: string;
  promptVersion: string;
  reasoningEffort?: ReasoningEffort;
  timeoutMs: number;
  matcher: Matcher;
  pricing: Pricing;
  /** Stop before the next case once spend reaches this many USD. */
  budgetUsd?: number;
  /**
   * How `url` cases run. `pipeline` (default) is production: JSON-LD first, the
   * model only when a page has none. `model` skips JSON-LD so the model reads every page.
   */
  urlPath?: UrlPath;
  /** Test seams for `url` cases; the defaults use real DNS and HTTPS. */
  urlDeps?: { resolve?: Resolver; transport?: Transport };
  now?: () => number;
};

export const URL_PATHS = ['pipeline', 'model'] as const;
export type UrlPath = (typeof URL_PATHS)[number];

type Extracted = {
  result: ExtractionResult;
  usage?: ExtractionUsage;
  urlSource?: ExtractSource;
};

async function extractCase(item: LabeledCase, options: EvalOptions): Promise<Extracted> {
  const effort =
    options.reasoningEffort === undefined ? {} : { reasoningEffort: options.reasoningEffort };
  if (item.kind !== 'url') {
    const input = await caseInput(item, options.setPath);
    return extractIngredients(options.provider, input, {
      timeoutMs: options.timeoutMs,
      model: options.model,
      promptVersion: options.promptVersion,
      ...effort,
    });
  }
  // A fresh cache and an unlimited quota per case, so every cell fetches and extracts on its own.
  const page = await runUrlPipeline(item.url ?? '', {
    cache: new MemoryCacheStore(),
    quota: createQuota(new MemoryCounterStore(), Number.POSITIVE_INFINITY),
    provider: options.provider,
    config: {
      mode: 'live',
      model: options.model,
      promptVersion: options.promptVersion,
      urlCacheTtlMs: 60_000,
      modelTimeoutMs: options.timeoutMs,
      reasoningEffort: options.reasoningEffort,
    },
    skipJsonLd: options.urlPath === 'model',
    ...(options.urlDeps?.resolve ? { resolve: options.urlDeps.resolve } : {}),
    ...(options.urlDeps?.transport ? { transport: options.urlDeps.transport } : {}),
  });
  return {
    result: { readable: page.readable, detectedType: page.detectedType, items: page.items },
    urlSource: page.source,
    ...(page.usage ? { usage: page.usage } : {}),
  };
}

export type EvalRun = {
  scores: CaseScore[];
  report: Report;
  stoppedEarly: boolean;
  skipped: number;
};

/**
 * Runs every case through the same `extractIngredients` → `matchItems` path the
 * service uses (TDD §7.9). Cases run one at a time so latency is not skewed by
 * concurrency and the budget check is exact. A `ToolError` is scored as a
 * failed case; anything else is a harness bug and aborts the run.
 */
export async function runEval(options: EvalOptions): Promise<EvalRun> {
  const now = options.now ?? (() => performance.now());
  const scores: CaseScore[] = [];
  let spent = 0;

  for (const item of options.set.cases) {
    if (options.budgetUsd !== undefined && spent >= options.budgetUsd) break;

    const started = now();
    let outcome: CaseOutcome;
    try {
      const { result, usage, urlSource } = await extractCase(item, options);
      const { matches, unmatchedCount } = matchItems(result.items, options.matcher);
      outcome = {
        ok: true,
        result,
        matchedSlugs: matches.map((match) => match.slug),
        unmatchedCount,
        unmatchedTerms: result.items
          .filter((entry) => entry.isFood && options.matcher.match(entry.term) === null)
          .map((entry) => entry.term),
        ...(usage ? { usage } : {}),
        ...(urlSource ? { urlSource } : {}),
      };
    } catch (error) {
      if (!(error instanceof ToolError)) throw error;
      const status = providerStatus(error.cause);
      outcome = {
        ok: false,
        errorCode: error.code,
        ...(status !== undefined ? { providerStatus: status } : {}),
      };
    }
    const latencyMs = Math.round(now() - started);

    const score = scoreCase(item, outcome, latencyMs);
    scores.push(score);
    spent += costUsd(score.inputTokens, score.outputTokens, options.pricing);
  }

  const skipped = options.set.cases.length - scores.length;
  return {
    scores,
    report: aggregate(scores, options.pricing),
    stoppedEarly: skipped > 0,
    skipped,
  };
}

/** The HTTP status of a provider error: SDK errors carry `status`; our fetch adapters say "HTTP 503". */
export function providerStatus(cause: unknown): number | undefined {
  if (!(cause instanceof Error)) return undefined;
  const status = (cause as { status?: unknown }).status;
  if (typeof status === 'number') return status;
  const match = /\bHTTP (\d{3})\b/.exec(cause.message);
  return match ? Number(match[1]) : undefined;
}
