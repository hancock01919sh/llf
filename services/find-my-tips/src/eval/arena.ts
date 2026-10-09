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
import type { EvalRun } from './runner';

/** Providers we want to compare but have no adapter or IT approval for yet. */
export const PROPOSED_PROVIDERS = ['gemini'] as const;
const ARENA_PROVIDERS = [...PROVIDERS, ...PROPOSED_PROVIDERS] as const;

const usdAmount = z.number().nonnegative();

export const ArenaCell = z
  .object({
    label: z.string().min(1).optional(),
    provider: z.enum(ARENA_PROVIDERS),
    model: z.string().min(1),
    effort: z.enum(REASONING_EFFORTS).optional(),
    /** USD per million tokens, from the provider's public price list on the run date. */
    pricing: z.object({ inputPerMTok: usdAmount, outputPerMTok: usdAmount }),
    /** Per-cell spend cap in USD. */
    budgetUsd: usdAmount.optional(),
    enabled: z.boolean().default(true),
    note: z.string().optional(),
  })
  .superRefine((cell, ctx) => {
    if (cell.enabled && (PROPOSED_PROVIDERS as readonly string[]).includes(cell.provider)) {
      ctx.addIssue({
        code: 'custom',
        path: ['enabled'],
        message: `${cell.provider} has no adapter yet (TDD §7.7 [PROPOSED]); set enabled: false`,
      });
    }
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
};

/** Why a live cell can't run here, or undefined if it can. */
export function missingFor(provider: ProviderName, keys: ProviderKeys): string | undefined {
  if (provider === 'anthropic' && !keys.anthropicApiKey) return 'no ANTHROPIC_API_KEY (OPEN-2)';
  if (provider === 'openai' && !keys.openaiApiKey) return 'no OPENAI_API_KEY (OPEN-1)';
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

const isProposed = (cell: ArenaCell): boolean =>
  (PROPOSED_PROVIDERS as readonly string[]).includes(cell.provider);

/** Runs the enabled cells one at a time, so the global cap holds across cells. */
export async function runArena(options: ArenaOptions): Promise<ArenaResult> {
  const { matrix } = options;
  const globalCap = options.budgetUsd ?? matrix.budgetUsd;
  const cells: ArenaCellResult[] = [];
  const skipped: ArenaSkip[] = [];
  let spentUsd = 0;

  for (const cell of matrix.cells) {
    const label = cellLabel(cell);
    if (!cell.enabled || isProposed(cell)) {
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
};

const rate = (value: number | null): string => (value === null ? 'n/a' : pct(value));
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
      (meta.matrixVersion === undefined ? '' : `, matrix \`${meta.matrixVersion}\``),
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
        escapeCell(label),
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
