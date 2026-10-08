import type { Matcher } from '@llf/matching';

import { extractIngredients } from '../extract';
import type { ExtractionProvider } from '../extract';
import { ToolError } from '../http';
import { matchItems } from '../match';
import type { LabeledSet } from './labeled-set';
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
  timeoutMs: number;
  matcher: Matcher;
  pricing: Pricing;
  /** Stop before the next case once spend reaches this many USD. */
  budgetUsd?: number;
  now?: () => number;
};

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

    const input = await caseInput(item, options.setPath);
    const started = now();
    let outcome: CaseOutcome;
    try {
      const { result, usage } = await extractIngredients(options.provider, input, {
        timeoutMs: options.timeoutMs,
        model: options.model,
        promptVersion: options.promptVersion,
      });
      const { matches, unmatchedCount } = matchItems(result.items, options.matcher);
      outcome = {
        ok: true,
        result,
        matchedSlugs: matches.map((match) => match.slug),
        unmatchedCount,
        ...(usage ? { usage } : {}),
      };
    } catch (error) {
      if (!(error instanceof ToolError)) throw error;
      outcome = { ok: false, errorCode: error.code };
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
