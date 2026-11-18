import type { GapClass, GapTerm } from '@llf/contracts/find-tips';
import { createHash } from 'node:crypto';

import { classifyGapTerms, filterGapTerms, GAP_PROMPT_VERSION } from '../gaps';
import type { ExtractionProvider, ExtractionUsage } from '../extract';
import type { GapCase, GapExpectedClass } from './gap-set';
import { KEPT_LABELS, PERSONAL_LABELS } from './gap-set';
import type { CatalogSource } from '../catalog';

/**
 * Who removed a term: the model's own `exclude` class, a filter rule, or nobody.
 * The distinction matters for D35: a term dropped by `model` never exercised the
 * denylist, so a clean run full of `model` rows proves less than one full of
 * `filter` rows.
 */
export type GapDrop = 'kept' | 'model' | 'filter' | 'error';

export type GapCaseResult = {
  id: string;
  /** Raw model classification, one per input term. */
  model: { term: string; expected: GapExpectedClass; modelClass: GapClass; droppedBy: GapDrop }[];
  /** After filterGapTerms. */
  kept: GapTerm[];
  /** True when a kept term corresponds to a `personal` ground-truth label. */
  leaks: string[];
  /** Terms expected to be kept that are missing from kept[]. */
  missing: string[];
  /** Non-personal terms whose model class disagrees with the expected class. */
  wrongClass: string[];
  /** True when leaks.length === 0 && missing.length === 0 && wrongClass.length === 0. */
  passed: boolean;
  latencyMs: number;
  usage?: ExtractionUsage;
  error?: string;
};

export type GapRunSummary = {
  cases: number;
  passed: number;
  leakedCases: number;
  leakedTerms: number;
  missingKept: number;
  wrongClass: number;
  totalKeptExpected: number;
  classAccuracy: number | null;
  /** Personal terms the model itself marked `exclude`. */
  personalDroppedByModel: number;
  /** Personal terms the model treated as food but a filter rule removed. */
  personalDroppedByFilter: number;
  /** The bar from D35 / TDD §7.8: zero personal leaks across every case. */
  privacyPassed: boolean;
  /** True when every case has zero leaks AND zero expected-missing AND zero wrong-class. */
  perfectPass: boolean;
};

export type GapRun = {
  results: GapCaseResult[];
  summary: GapRunSummary;
  provider: string;
  model: string;
  promptVersion: string;
  catalogVersion: string;
  date: string;
};

const PERSONAL: ReadonlySet<GapExpectedClass> = PERSONAL_LABELS;
const KEPT: ReadonlySet<GapExpectedClass> = KEPT_LABELS;

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Whole-word-ish containment; a kept "maxwell street mix" does not leak a planted "max". */
function leaksPlanted(keptTerm: string, sourceTerm: string): boolean {
  const planted = sourceTerm.trim().toLowerCase();
  const needle = planted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${needle}([^a-z0-9]|$)`, 'i').test(keptTerm);
}

/**
 * Runs one gap case end to end through classifyGapTerms and filterGapTerms.
 * The isCatalogMatch predicate is always false — gap-eval input is exactly
 * the terms that did not match the catalog; we are measuring the step in
 * isolation.
 */
export async function runGapCase(
  item: GapCase,
  options: {
    provider: ExtractionProvider;
    model: string;
    catalog: CatalogSource;
  },
): Promise<GapCaseResult> {
  const started = Date.now();
  const terms = item.terms.map((t) => t.term);
  try {
    if (!options.provider.classifyGaps) {
      throw new Error(`provider "${options.provider.name}" has no classifyGaps`);
    }
    const classified = await classifyGapTerms(terms, {
      provider: options.provider,
      model: options.model,
      promptVersion: GAP_PROMPT_VERSION,
    });
    const kept = filterGapTerms(classified, () => false, terms);
    const keptIndex = new Map(kept.map((k) => [normalize(k.name), k]));
    const modelOutput = classified.items.map((out, idx) => {
      const term = terms[idx] ?? '';
      const droppedBy: GapDrop = keptIndex.has(normalize(term))
        ? 'kept'
        : out.class === 'exclude'
          ? 'model'
          : 'filter';
      return {
        term,
        expected: item.terms[idx]?.expectedClass ?? 'exclude',
        modelClass: out.class,
        droppedBy,
      };
    });

    // Leak = any kept term whose expected label is personal (i.e. the step let
    // something through that should never reach analytics).
    const leaks: string[] = [];
    for (const label of item.terms) {
      if (!PERSONAL.has(label.expectedClass)) continue;
      // Check by normalized form of the *labeled* term and as a planted phrase
      // within any kept name. Covers both "Max" (kept as "max kibble") and
      // "Max's kibble" (kept verbatim).
      if (leaksPlanted(label.term, label.term)) {
        for (const keptTerm of kept) {
          if (
            keptTerm.name.toLowerCase().replace(/\s+/g, ' ') ===
              label.term.toLowerCase().replace(/\s+/g, ' ') ||
            leaksPlanted(keptTerm.name, label.term)
          ) {
            leaks.push(keptTerm.name);
          }
        }
      }
    }
    const leaksUnique = [...new Set(leaks)];

    // "Missing kept" = a term we expected to reach kept[] didn't.
    // "Wrong class" = model output ≠ expectedClass for non-personal terms.
    // Both count against the overall perfectPass, but missing is the more
    // important signal because it means a real gap was hidden from analytics.
    const missing: string[] = [];
    const wrongClass: string[] = [];
    for (const label of item.terms) {
      if (PERSONAL.has(label.expectedClass)) continue;
      const key = normalize(label.term);
      const modelRow = modelOutput.find(
        (row) => row.term.toLowerCase().replace(/\s+/g, ' ') === key,
      );
      const modelClass = modelRow?.modelClass ?? 'exclude';
      if (modelClass !== label.expectedClass) wrongClass.push(label.term);
      if (KEPT.has(label.expectedClass) && !keptIndex.has(key)) {
        missing.push(label.term);
      }
    }

    return {
      id: item.id,
      model: modelOutput,
      kept,
      leaks: leaksUnique,
      missing,
      wrongClass,
      passed: leaksUnique.length === 0 && missing.length === 0 && wrongClass.length === 0,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      id: item.id,
      model: item.terms.map((t) => ({
        term: t.term,
        expected: t.expectedClass,
        modelClass: 'exclude' as GapClass,
        droppedBy: 'error' as GapDrop,
      })),
      kept: [],
      leaks: [],
      missing: [],
      wrongClass: [],
      passed: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function summarizeGapResults(results: GapCaseResult[]): GapRunSummary {
  const cases = results.length;
  const leakedCases = results.filter((r) => r.leaks.length > 0).length;
  const leakedTerms = results.reduce((s, r) => s + r.leaks.length, 0);
  const missingKept = results.reduce((s, r) => s + r.missing.length, 0);
  const wrongClass = results.reduce((s, r) => s + r.wrongClass.length, 0);
  const totalKeptExpected = results.reduce((s, r) => {
    const exp = r.model.filter((row) => KEPT.has(row.expected));
    const correct = exp.filter((row) => {
      const kept = r.kept.find(
        (k) =>
          k.name.toLowerCase().replace(/\s+/g, ' ') === row.term.toLowerCase().replace(/\s+/g, ' '),
      );
      return kept && kept.class === row.expected;
    });
    return s + correct.length;
  }, 0);
  const classTotal = results.reduce(
    (s, r) => s + r.model.filter((row) => KEPT.has(row.expected)).length,
    0,
  );
  const personalRows = results.flatMap((r) => r.model.filter((row) => PERSONAL.has(row.expected)));
  const personalDroppedByModel = personalRows.filter((r) => r.droppedBy === 'model').length;
  const personalDroppedByFilter = personalRows.filter((r) => r.droppedBy === 'filter').length;
  return {
    cases,
    passed: results.filter((r) => r.passed).length,
    leakedCases,
    leakedTerms,
    missingKept,
    wrongClass,
    totalKeptExpected,
    classAccuracy: classTotal === 0 ? null : totalKeptExpected / classTotal,
    personalDroppedByModel,
    personalDroppedByFilter,
    privacyPassed: leakedCases === 0,
    perfectPass: results.every((r) => r.passed) && missingKept === 0 && wrongClass === 0,
  };
}

export function fingerprintRun(
  provider: string,
  model: string,
  catalogVersion: string,
  cases: GapCaseResult[],
): string {
  const payload = cases
    .map(
      (c) =>
        `${c.id}:leaks=${c.leaks.length},missing=${c.missing.length},wrong=${c.wrongClass.length}`,
    )
    .join('|');
  return createHash('sha256')
    .update(`${provider}|${model}|${catalogVersion}|${payload}`)
    .digest('hex')
    .slice(0, 12);
}

export async function runGapSet(
  set: { cases: GapCase[]; version: string },
  options: {
    provider: ExtractionProvider;
    model: string;
    catalog: CatalogSource;
  },
): Promise<GapRun> {
  const catalogVersion = await options.catalog.version();
  const results = await Promise.all(set.cases.map((item) => runGapCase(item, options)));
  const summary = summarizeGapResults(results);
  return {
    results,
    summary,
    provider: options.provider.name,
    model: options.model,
    promptVersion: GAP_PROMPT_VERSION,
    catalogVersion,
    date: new Date().toISOString(),
  };
}
