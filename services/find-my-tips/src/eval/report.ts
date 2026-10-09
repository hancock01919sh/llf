import type { ReasoningEffort } from '../extract';
import type { Forecast, ForecastOptions } from './forecast';
import { forecast } from './forecast';
import type { CaseScore, Summary } from './metrics';
import { meetsTargets, TARGETS } from './metrics';
import type { EvalRun } from './runner';

export type RunMeta = {
  date: string;
  provider: string;
  model: string;
  promptVersion: string;
  setVersion: string;
  catalogVersion: string;
  budgetUsd?: number;
  reasoningEffort?: ReasoningEffort;
};

export const pct = (value: number): string => `${(value * 100).toFixed(1)}%`;
export const usd = (value: number): string => `$${value.toFixed(4)}`;
export const dollars = (value: number): string =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const count = (value: number): string => value.toLocaleString('en-US');
const list = (values: readonly string[]): string => (values.length ? values.join(', ') : '—');

/** Monthly and 12-month spend at the planning volumes (TDD §9.5). Says "cap", not "budget". */
export function renderForecast(f: Forecast): string[] {
  const growth = f.monthlyGrowth === 0 ? '' : `, ${pct(f.monthlyGrowth)} monthly growth`;
  return [
    '## Cost forecast',
    '',
    `${usd(f.costPerUseUsd)} per use (${f.callsPerUse} call${f.callsPerUse === 1 ? '' : 's'}), ${dollars(f.monthlyCapUsd)}/month cap${growth}. Break-even: ${f.maxUsesUnderCap === null ? '—' : count(f.maxUsesUnderCap)} uses/month.`,
    '',
    `| Uses/month | Month 1 | Peak month | ${f.months}-month total | Within cap |`,
    '|---|---|---|---|---|',
    ...f.rows.map(
      (row) =>
        `| ${count(row.usesPerMonth)} | ${dollars(row.monthlyUsd)} | ${dollars(row.peakMonthlyUsd)} | ${dollars(row.totalUsd)} | ${row.withinCap ? '✅' : '❌'} |`,
    ),
    '',
  ];
}

function summaryRow(label: string, s: Summary): string {
  return `| ${label} | ${s.cases} | ${s.passed} | ${pct(s.precision)} | ${pct(s.recall)} | ${pct(s.readableAccuracy)} | ${s.injectionPassRate === null ? '—' : pct(s.injectionPassRate)} | ${s.errors} | ${s.latencyP50Ms} | ${s.latencyP95Ms} | ${usd(s.costUsd)} |`;
}

const SUMMARY_HEAD = [
  '| Group | Cases | Passed | Precision | Recall | Readable | Injection | Errors | p50 ms | p95 ms | Cost |',
  '|---|---|---|---|---|---|---|---|---|---|---|',
];

function caseRow(score: CaseScore): string {
  return `| \`${score.id}\` | ${score.passed ? '✅' : '❌'} | ${list(score.matchedSlugs)} | ${list(score.missingSlugs)} | ${list(score.extraSlugs)} | ${score.unmatchedCount} | ${score.errorCode ?? '—'} |`;
}

export type RenderOptions = {
  /** Adds the "Cost forecast" section using the run's measured $ per call. */
  forecast?: Omit<ForecastOptions, 'costPerCallUsd'>;
};

/**
 * Renders a run as markdown for PROOF_DOC P9. Only ids, slugs, counts, and
 * error codes appear: never the case text or anything the model returned.
 */
export function renderMarkdown(meta: RunMeta, run: EvalRun, options: RenderOptions = {}): string {
  const { overall } = run.report;
  const verdict = meetsTargets(overall) ? '✅ meets the G2 bar' : '❌ misses the G2 bar';
  const effort = meta.reasoningEffort === undefined ? '' : `, effort \`${meta.reasoningEffort}\``;
  const reasoning = overall.reasoningTokens > 0 ? ` (${overall.reasoningTokens} reasoning)` : '';
  const lines = [
    `# P9 eval: ${meta.model} (${meta.date})`,
    '',
    `- Provider: \`${meta.provider}\`, model \`${meta.model}\`${effort}, prompt \`${meta.promptVersion}\``,
    `- Set: \`${meta.setVersion}\`, catalog \`${meta.catalogVersion}\``,
    `- Tokens: ${overall.inputTokens} in / ${overall.outputTokens} out${reasoning}, cost ${usd(overall.costUsd)}${meta.budgetUsd === undefined ? '' : ` of ${usd(meta.budgetUsd)} budget`}, ${usd(overall.costPerCallUsd)}/call`,
    `- Not-food rejected: ${overall.nonFoodRejectionRate === null ? '—' : pct(overall.nonFoodRejectionRate)}; timeouts: ${overall.timeouts}`,
    ...(run.stoppedEarly ? [`- **Stopped early on budget: ${run.skipped} case(s) not run.**`] : []),
    '',
    `## Result: ${verdict}`,
    '',
    `Targets (TDD §7.9, OPEN-8): precision ≥ ${pct(TARGETS.precision)}, recall ≥ ${pct(TARGETS.recall)}, injection pass rate ${pct(TARGETS.injectionPassRate)}.`,
    '',
    ...SUMMARY_HEAD,
    summaryRow('**Overall**', overall),
    '',
    ...(options.forecast === undefined
      ? []
      : renderForecast(forecast({ ...options.forecast, costPerCallUsd: overall.costPerCallUsd }))),
    '## By input kind',
    '',
    ...SUMMARY_HEAD,
    ...Object.entries(run.report.byKind).map(([kind, s]) => summaryRow(kind, s)),
    '',
    '## By detected type',
    '',
    ...SUMMARY_HEAD,
    ...Object.entries(run.report.byDetectedType).map(([type, s]) => summaryRow(type, s)),
    '',
    '## Cases',
    '',
    '| Case | Pass | Matched | Missing | Extra | Unmatched | Error |',
    '|---|---|---|---|---|---|---|',
    ...run.scores.map(caseRow),
    '',
  ];
  return lines.join('\n');
}
