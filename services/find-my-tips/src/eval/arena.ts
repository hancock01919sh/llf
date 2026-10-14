/**
 * Model arena (BD3244-37, TDD §7.7 / §9.5): runs the same labeled set through a
 * matrix of provider × model × reasoning-effort cells and renders one scorecard.
 * Feeds the OPEN-1 recommendation. Never prints case text or model output.
 */
import type { Matcher } from '@llf/matching';
import { z } from 'zod';

import { PROVIDERS } from '../config';
import type { ProviderName } from '../config';
import { REASONING_EFFORTS } from '../extract/types';
import type { ExtractionProvider } from '../extract/types';
import { forecast } from './forecast';
import type { Forecast } from './forecast';
import type { LabeledSet } from './labeled-set';
import { meetsTargets } from './metrics';
import { count, dollars, pct, usd } from './report';
import { runEval } from './runner';
import type { EvalRun, UrlPath } from './runner';

const usdAmount = z.number().nonnegative();

export const ArenaCell = z.object({
  label: z.string().min(1).optional(),
  provider: z.enum(PROVIDERS),
  model: z.string().min(1),
  effort: z.enum(REASONING_EFFORTS).optional(),
  /** USD per million tokens, from the provider's public price list on the run date. */
  pricing: z.object({ inputPerMTok: usdAmount, outputPerMTok: usdAmount }),
  /** Per-cell spend cap in USD. */
  budgetUsd: usdAmount.optional(),
  enabled: z.boolean().default(true),
  /**
   * A quality yardstick, not a production candidate: runs regardless of the
   * monthly cap, and the report measures every candidate against it.
   */
  reference: z.boolean().default(false),
  note: z.string().optional(),
});
export type ArenaCell = z.infer<typeof ArenaCell>;

export const ArenaMatrix = z
  .object({
    version: z.string().optional(),
    description: z.string().optional(),
    /** Labeled set, relative to the matrix file. */
    setPath: z.string().optional(),
    /** Global spend cap across all cells, in USD. */
    budgetUsd: usdAmount.optional(),
    monthlyCapUsd: usdAmount.optional(),
    usesPerMonth: z.array(z.number().int().positive()).min(1).optional(),
    /** 1 today; 2 if the guardrail becomes a separate pre-call. */
    callsPerUse: z.number().int().positive().optional(),
    cells: z.array(ArenaCell).min(1),
  })
  .superRefine((matrix, ctx) => {
    const seen = new Set<string>();
    matrix.cells.forEach((cell, index) => {
      const label = cellLabel(cell);
      if (seen.has(label)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cells', index, 'label'],
          message: `duplicate cell label "${label}"`,
        });
      }
      seen.add(label);
    });
  });
export type ArenaMatrix = z.infer<typeof ArenaMatrix>;

export function cellLabel(
  cell: Pick<ArenaCell, 'label' | 'provider' | 'model' | 'effort'>,
): string {
  if (cell.label !== undefined) return cell.label;
  return [cell.provider, cell.model, cell.effort].filter((part) => part !== undefined).join('/');
}

export type ProviderKeys = {
  anthropicApiKey?: string | undefined;
  openaiApiKey?: string | undefined;
  geminiApiKey?: string | undefined;
};

/** Why a live cell can't run here, or undefined if it can. */
export function missingFor(provider: ProviderName, keys: ProviderKeys): string | undefined {
  if (provider === 'anthropic' && !keys.anthropicApiKey) return 'no ANTHROPIC_API_KEY (OPEN-2)';
  if (provider === 'openai' && !keys.openaiApiKey) return 'no OPENAI_API_KEY (OPEN-1)';
  if (provider === 'gemini' && !keys.geminiApiKey) return 'no GEMINI_API_KEY';
  if (provider === 'bedrock') return 'bedrock adapter is a stub until OPEN-1';
  return undefined;
}

export type ProviderChoice = ExtractionProvider | { skip: string };

export type ArenaOptions = {
  matrix: ArenaMatrix;
  set: LabeledSet;
  setPath: string;
  matcher: Matcher;
  promptVersion: string;
  timeoutMs: number;
  /** Overrides matrix.budgetUsd. */
  budgetUsd?: number;
  /** How `url` cases run (see EvalOptions.urlPath). */
  urlPath?: UrlPath;
  /** Builds the provider for a cell, or says why the cell can't run (missing key, no adapter). */
  providerFor: (cell: ArenaCell & { provider: ProviderName }) => ProviderChoice;
  now?: () => number;
};

export type ArenaCellResult = {
  label: string;
  cell: ArenaCell;
  run: EvalRun;
  forecast: Forecast;
  /** Cap this cell ran under: the smaller of its own cap and what was left globally. */
  budgetUsd?: number;
};

export type ArenaSkip = { label: string; reason: string };

export type ArenaResult = {
  cells: ArenaCellResult[];
  skipped: ArenaSkip[];
  spentUsd: number;
  budgetUsd?: number;
};

/** Runs the enabled cells one at a time, so the global cap holds across cells. */
export async function runArena(options: ArenaOptions): Promise<ArenaResult> {
  const { matrix } = options;
  const globalCap = options.budgetUsd ?? matrix.budgetUsd;
  const cells: ArenaCellResult[] = [];
  const skipped: ArenaSkip[] = [];
  let spentUsd = 0;

  for (const cell of matrix.cells) {
    const label = cellLabel(cell);
    if (!cell.enabled) {
      skipped.push({ label, reason: cell.note ?? 'disabled in the matrix' });
      continue;
    }
    const remaining = globalCap === undefined ? undefined : globalCap - spentUsd;
    if (remaining !== undefined && remaining <= 0) {
      skipped.push({ label, reason: 'global cap reached' });
      continue;
    }
    const choice = options.providerFor(cell as ArenaCell & { provider: ProviderName });
    if ('skip' in choice) {
      skipped.push({ label, reason: choice.skip });
      continue;
    }
    const caps = [cell.budgetUsd, remaining].filter((cap): cap is number => cap !== undefined);
    const budgetUsd = caps.length === 0 ? undefined : Math.min(...caps);

    const run = await runEval({
      set: options.set,
      setPath: options.setPath,
      provider: choice,
      model: cell.model,
      promptVersion: options.promptVersion,
      ...(cell.effort === undefined ? {} : { reasoningEffort: cell.effort }),
      timeoutMs: options.timeoutMs,
      matcher: options.matcher,
      pricing: cell.pricing,
      ...(budgetUsd === undefined ? {} : { budgetUsd }),
      ...(options.urlPath === undefined ? {} : { urlPath: options.urlPath }),
      ...(options.now === undefined ? {} : { now: options.now }),
    });
    spentUsd += run.report.overall.costUsd;
    cells.push({
      label,
      cell,
      run,
      forecast: forecast({
        costPerCallUsd: run.report.overall.costPerCallUsd,
        ...(matrix.callsPerUse === undefined ? {} : { callsPerUse: matrix.callsPerUse }),
        ...(matrix.monthlyCapUsd === undefined ? {} : { monthlyCapUsd: matrix.monthlyCapUsd }),
        ...(matrix.usesPerMonth === undefined ? {} : { usesPerMonth: matrix.usesPerMonth }),
      }),
      ...(budgetUsd === undefined ? {} : { budgetUsd }),
    });
  }

  return { cells, skipped, spentUsd, ...(globalCap === undefined ? {} : { budgetUsd: globalCap }) };
}

export type ArenaMeta = {
  date: string;
  promptVersion: string;
  setVersion: string;
  catalogVersion: string;
  matrixVersion?: string;
  /** Set when the run has url cases. */
  urlPath?: UrlPath;
};

const rate = (value: number | null): string => (value === null ? 'n/a' : pct(value));

/** Signed gap in percentage points, e.g. "−4.2 pp". */
function gap(value: number | null, reference: number | null): string {
  if (value === null || reference === null) return 'n/a';
  const pp = (value - reference) * 100;
  if (Math.abs(pp) < 0.05) return '±0.0 pp';
  return `${pp > 0 ? '+' : '−'}${Math.abs(pp).toFixed(1)} pp`;
}

const f1 = (precision: number, recall: number): number =>
  precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

const withinCap = (c: ArenaCellResult): boolean => c.forecast.rows.every((r) => r.withinCap);

function tally(slugs: string[], limit = 8): string {
  const counts = new Map<string, number>();
  for (const slug of slugs) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([slug, n]) => (n > 1 ? `\`${slug}\` ×${n}` : `\`${slug}\``))
    .join(', ');
}

export type MissComparison = {
  /** Correct ingredients the reference found and the candidate did not. */
  missed: { caseId: string; slug: string }[];
  /** Wrong ingredients the candidate reported and the reference did not. */
  added: { caseId: string; slug: string }[];
  /** Non-food images the reference rejected and the candidate treated as food. */
  nonFoodAccepted: string[];
  /** Cases the reference answered and the candidate failed outright. */
  failed: string[];
  /** The other direction, so the gap is not overstated. */
  candidateOnly: { found: number; avoided: number; nonFoodRejected: number };
};

/** Case-by-case: what the candidate gets wrong that the reference gets right. */
export function compareToReference(candidate: EvalRun, reference: EvalRun): MissComparison {
  const ref = new Map(reference.scores.map((score) => [score.id, score]));
  const out: MissComparison = {
    missed: [],
    added: [],
    nonFoodAccepted: [],
    failed: [],
    candidateOnly: { found: 0, avoided: 0, nonFoodRejected: 0 },
  };
  for (const c of candidate.scores) {
    const r = ref.get(c.id);
    if (r === undefined) continue;
    if (c.errorCode !== undefined && r.errorCode === undefined) out.failed.push(c.id);
    if (!c.expectedReadable) {
      if (!c.readableCorrect && r.readableCorrect) out.nonFoodAccepted.push(c.id);
      if (c.readableCorrect && !r.readableCorrect) out.candidateOnly.nonFoodRejected += 1;
    }
    const refCorrect = new Set(r.matchedSlugs.filter((slug) => !r.extraSlugs.includes(slug)));
    const candCorrect = new Set(c.matchedSlugs.filter((slug) => !c.extraSlugs.includes(slug)));
    for (const slug of c.missingSlugs) {
      if (refCorrect.has(slug)) out.missed.push({ caseId: c.id, slug });
    }
    for (const slug of r.missingSlugs) if (candCorrect.has(slug)) out.candidateOnly.found += 1;
    for (const slug of c.extraSlugs) {
      if (!r.extraSlugs.includes(slug)) out.added.push({ caseId: c.id, slug });
    }
    for (const slug of r.extraSlugs)
      if (!c.extraSlugs.includes(slug)) out.candidateOnly.avoided += 1;
  }
  return out;
}

function missesSection(
  candidate: ArenaCellResult,
  reference: ArenaCellResult,
  examples = 5,
): string[] {
  const m = compareToReference(candidate.run, reference.run);
  const name = escapeCell(candidate.label);
  const lines = [`### What ${name} misses out on`, ''];
  lines.push(
    `- **Ingredients missed** that the reference found: ${m.missed.length}` +
      (m.missed.length > 0 ? ` (${tally(m.missed.map((x) => x.slug))})` : ''),
    `- **Wrong ingredients added** that the reference avoided: ${m.added.length}` +
      (m.added.length > 0 ? ` (${tally(m.added.map((x) => x.slug))})` : ''),
    `- **Non-food images treated as food** that the reference rejected: ${m.nonFoodAccepted.length}` +
      (m.nonFoodAccepted.length > 0
        ? ` (${m.nonFoodAccepted.map((id) => `\`${id}\``).join(', ')})`
        : ''),
    `- **Failed calls** where the reference answered: ${m.failed.length}`,
    `- In the other direction, ${name} found ${m.candidateOnly.found} ingredient(s) the reference missed, ` +
      `avoided ${m.candidateOnly.avoided} wrong one(s) the reference added, and rejected ` +
      `${m.candidateOnly.nonFoodRejected} non-food image(s) the reference accepted.`,
  );

  const perCase = new Map<string, { missed: string[]; added: string[] }>();
  for (const { caseId, slug } of m.missed) {
    const entry = perCase.get(caseId) ?? { missed: [], added: [] };
    entry.missed.push(slug);
    perCase.set(caseId, entry);
  }
  for (const { caseId, slug } of m.added) {
    const entry = perCase.get(caseId) ?? { missed: [], added: [] };
    entry.added.push(slug);
    perCase.set(caseId, entry);
  }
  const worst = [...perCase]
    .sort(
      (a, b) =>
        b[1].missed.length + b[1].added.length - (a[1].missed.length + a[1].added.length) ||
        a[0].localeCompare(b[0]),
    )
    .slice(0, examples);
  if (worst.length > 0) {
    lines.push(
      '',
      'Largest gaps by case:',
      '',
      '| Case | Missed | Wrongly added |',
      '|---|---|---|',
    );
    for (const [caseId, entry] of worst) {
      const list = (slugs: string[]) =>
        slugs.length === 0 ? '—' : slugs.map((x) => `\`${x}\``).join(', ');
      lines.push(`| \`${caseId}\` | ${list(entry.missed)} | ${list(entry.added)} |`);
    }
  }
  lines.push('');
  return lines;
}

/**
 * "What the budget buys": every candidate next to the reference cell, with the
 * quality gap and the monthly cost, so the client can weigh cost against quality.
 */
function budgetSection(cells: ArenaCellResult[]): string[] {
  const reference = cells.find((c) => c.cell.reference && !c.run.stoppedEarly);
  if (reference === undefined) return [];
  const candidates = cells
    .filter((c) => !c.cell.reference && c.cell.provider !== 'mock' && !c.run.stoppedEarly)
    .sort((a, b) => a.run.report.overall.costPerCallUsd - b.run.report.overall.costPerCallUsd);
  if (candidates.length === 0) return [];

  const ref = reference.run.report.overall;
  const score = (c: ArenaCellResult) =>
    f1(c.run.report.overall.precision, c.run.report.overall.recall);
  const best = candidates.filter(withinCap).sort((a, b) => score(b) - score(a))[0];
  const volumes = reference.forecast.rows.map((r) => `$/mo @ ${count(r.usesPerMonth)}`);
  const cap = dollars(reference.forecast.monthlyCapUsd);

  const lines = ['## What the budget buys', ''];
  lines.push(
    `Reference: **${escapeCell(reference.label)}**, precision ${pct(ref.precision)}, recall ${pct(ref.recall)}, ` +
      `not-food rejected ${rate(ref.nonFoodRejectionRate)}, ` +
      `${reference.forecast.rows.map((r) => `${dollars(r.monthlyUsd)}/mo @ ${count(r.usesPerMonth)}`).join(', ')}` +
      `${withinCap(reference) ? '' : ` (over the ${cap}/month cap)`}.`,
  );
  if (best === undefined) {
    lines.push('', `No candidate stays within the ${cap}/month cap.`);
  } else {
    const b = best.run.report.overall;
    lines.push(
      '',
      `Best within the ${cap}/month cap: **${escapeCell(best.label)}**, precision ${pct(b.precision)} (${gap(b.precision, ref.precision)}), ` +
        `recall ${pct(b.recall)} (${gap(b.recall, ref.recall)}), ` +
        `${best.forecast.rows.map((r) => `${dollars(r.monthlyUsd)}/mo @ ${count(r.usesPerMonth)}`).join(', ')}.`,
    );
  }
  lines.push('');

  const head = [
    'Cell',
    'Precision',
    'vs ref',
    'Recall',
    'vs ref',
    'Not-food rejected',
    'vs ref',
    ...volumes,
    'Within cap',
  ];
  lines.push(`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`);
  const row = (c: ArenaCellResult, isReference: boolean) => {
    const s = c.run.report.overall;
    const same = (text: string) => (isReference ? '—' : text);
    return `| ${[
      isReference ? `**${escapeCell(c.label)}** (reference)` : escapeCell(c.label),
      pct(s.precision),
      same(gap(s.precision, ref.precision)),
      pct(s.recall),
      same(gap(s.recall, ref.recall)),
      rate(s.nonFoodRejectionRate),
      same(gap(s.nonFoodRejectionRate, ref.nonFoodRejectionRate)),
      ...c.forecast.rows.map((r) => dollars(r.monthlyUsd)),
      withinCap(c) ? '✅' : '❌',
    ].join(' | ')} |`;
  };
  lines.push(row(reference, true));
  for (const c of candidates) lines.push(row(c, false));
  lines.push(
    '',
    'Candidates are sorted by cost. "Best" is the highest F1 (precision and recall combined) among candidates within the cap. The reference shows what quality is possible, whatever it costs.',
    '',
  );
  if (best !== undefined) lines.push(...missesSection(best, reference));
  return lines;
}
const escapeCell = (value: string): string => value.replaceAll('|', '\\|');

export function renderArenaMarkdown(meta: ArenaMeta, result: ArenaResult): string {
  const first = result.cells[0]?.forecast;
  const volumes = first?.rows.map((row) => row.usesPerMonth) ?? [];
  const volumeHeads = volumes.map((uses) => `$/mo @ ${count(uses)}`);
  const cap = first === undefined ? undefined : dollars(first.monthlyCapUsd);

  const lines = [
    `# Model arena: ${meta.date}`,
    '',
    `- Prompt \`${meta.promptVersion}\`, set \`${meta.setVersion}\`, catalog \`${meta.catalogVersion}\`` +
      (meta.matrixVersion === undefined ? '' : `, matrix \`${meta.matrixVersion}\``) +
      (meta.urlPath === undefined ? '' : `, URL path \`${meta.urlPath}\``),
    `- Spent ${usd(result.spentUsd)}` +
      (result.budgetUsd === undefined
        ? ' (no global cap)'
        : ` of a ${dollars(result.budgetUsd)} global cap`),
  ];
  if (first !== undefined) {
    lines.push(
      `- Forecast: ${first.callsPerUse} model call(s) per use, ${cap}/month cap, ${first.months} months`,
    );
  }
  lines.push('');

  if (result.cells.length === 0) {
    lines.push('No cells ran.', '');
  } else {
    const head = [
      'Cell',
      'Provider / model / effort',
      'Cases',
      'Precision',
      'Recall',
      'Not-food rejected',
      'Injection',
      'p50 / p95 ms',
      '$/call',
      ...volumeHeads,
      'Within cap',
      'G2 bar',
    ];
    lines.push(`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`);
    for (const { label, cell, run, forecast: f } of result.cells) {
      const s = run.report.overall;
      const scored = run.stoppedEarly
        ? `${s.cases} (stopped, ${run.skipped} left)`
        : String(s.cases);
      const row = [
        escapeCell(cell.reference ? `${label} (reference)` : label),
        escapeCell([cell.provider, cell.model, cell.effort ?? '—'].join(' / ')),
        scored,
        pct(s.precision),
        pct(s.recall),
        rate(s.nonFoodRejectionRate),
        rate(s.injectionPassRate),
        `${Math.round(s.latencyP50Ms)} / ${Math.round(s.latencyP95Ms)}`,
        usd(s.costPerCallUsd),
        ...f.rows.map((r) => dollars(r.monthlyUsd)),
        f.rows.every((r) => r.withinCap) ? '✅' : '❌',
        meetsTargets(s) ? '✅' : '❌',
      ];
      lines.push(`| ${row.join(' | ')} |`);
    }
    lines.push('');
  }

  lines.push(...budgetSection(result.cells));

  const stopped = result.cells.filter((c) => c.run.stoppedEarly);
  if (stopped.length > 0) {
    lines.push('## Stopped at the cap', '');
    for (const c of stopped) {
      lines.push(
        `- ${escapeCell(c.label)}: ${c.run.skipped} case(s) not run (cap ${dollars(c.budgetUsd ?? 0)})`,
      );
    }
    lines.push('');
  }

  if (result.skipped.length > 0) {
    lines.push('## Skipped cells', '');
    for (const s of result.skipped) lines.push(`- ${escapeCell(s.label)}: ${escapeCell(s.reason)}`);
    lines.push('');
  }

  lines.push(
    '## Reading this',
    '',
    '- The G2 bar is the TDD §7.7 target: precision ≥ 90%, recall ≥ 80%, every injection case passes.',
    '- $/month is month-1 spend at the measured $/call; "within cap" checks every month of the horizon.',
    '- Token counts on the mock are zero, so its cost columns read $0.',
    '- Synthetic or pilot sets are directional only; the OPEN-1 call needs the licensed set.',
    '',
  );
  return lines.join('\n');
}
