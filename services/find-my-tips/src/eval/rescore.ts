import type { Matcher } from '@llf/matching';

import { matchItems } from '../match';
import type { ArenaCellResult, ArenaResult } from './arena';
import type { LabeledSet } from './labeled-set';
import type { CaseOutcome, CaseScore } from './metrics';
import { aggregate, scoreCase } from './metrics';

export class RescoreError extends Error {}

/**
 * Re-scores one stored case against another catalog or set of labels, using the
 * terms the model returned (`extractedItems`). No model is called. Errors stay
 * errors; tokens, latency and the URL source are carried over.
 */
export function rescoreCase(
  stored: CaseScore,
  item: LabeledSet['cases'][number],
  matcher: Matcher,
): CaseScore {
  let outcome: CaseOutcome;
  if (stored.errorCode !== undefined) {
    outcome = {
      ok: false,
      errorCode: stored.errorCode,
      ...(stored.providerStatus === undefined ? {} : { providerStatus: stored.providerStatus }),
    };
  } else {
    if (stored.extractedItems === undefined) {
      throw new RescoreError(
        `case "${stored.id}" has no extractedItems; the run predates term recording and can't be re-scored`,
      );
    }
    const items = stored.extractedItems;
    const { matches, unmatchedCount } = matchItems(items, matcher);
    // The run keeps whether the readable flag was right, not the flag itself.
    const readable = stored.readableCorrect ? item.expectedReadable : !item.expectedReadable;
    outcome = {
      ok: true,
      result: { readable, detectedType: stored.detectedType, items },
      matchedSlugs: matches.map((match) => match.slug),
      unmatchedCount,
      unmatchedTerms: items
        .filter((entry) => entry.isFood && matcher.match(entry.term) === null)
        .map((entry) => entry.term),
      usage: {
        inputTokens: stored.inputTokens,
        outputTokens: stored.outputTokens,
        reasoningTokens: stored.reasoningTokens,
      },
      ...(stored.urlSource === undefined ? {} : { urlSource: stored.urlSource }),
    };
  }
  return scoreCase(item, outcome, stored.latencyMs);
}

/**
 * Re-scores every cell of a stored arena run. Cases are paired by id; a case
 * missing from the new set is dropped, and a new case the run never saw is an
 * error (it has no model output to score).
 */
export function rescoreArena(result: ArenaResult, set: LabeledSet, matcher: Matcher): ArenaResult {
  const byId = new Map(set.cases.map((item) => [item.id, item]));
  const cells: ArenaCellResult[] = result.cells.map((cellResult) => {
    const seen = new Set(cellResult.run.scores.map((score) => score.id));
    const unseen = set.cases.filter((item) => !seen.has(item.id)).map((item) => item.id);
    if (unseen.length > 0 && !cellResult.run.stoppedEarly) {
      throw new RescoreError(
        `${cellResult.label}: the run has no output for ${unseen.slice(0, 5).join(', ')}` +
          (unseen.length > 5 ? ` and ${unseen.length - 5} more` : ''),
      );
    }
    const scores = cellResult.run.scores.flatMap((stored) => {
      const item = byId.get(stored.id);
      return item === undefined ? [] : [rescoreCase(stored, item, matcher)];
    });
    return {
      ...cellResult,
      run: { ...cellResult.run, scores, report: aggregate(scores, cellResult.cell.pricing) },
    };
  });
  return { ...result, cells };
}
