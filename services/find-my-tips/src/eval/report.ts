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
};

const pct = (value: number): string => `${(value * 100).toFixed(1)}%`;
const usd = (value: number): string => `$${value.toFixed(4)}`;
const list = (values: readonly string[]): string => (values.length ? values.join(', ') : '—');

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

/**
 * Renders a run as markdown for PROOF_DOC P9. Only ids, slugs, counts, and
 * error codes appear: never the case text or anything the model returned.
 */
export function renderMarkdown(meta: RunMeta, run: EvalRun): string {
  const { overall } = run.report;
  const verdict = meetsTargets(overall) ? '✅ meets the G2 bar' : '❌ misses the G2 bar';
  const lines = [
    `# P9 eval: ${meta.model} (${meta.date})`,
    '',
    `- Provider: \`${meta.provider}\`, model \`${meta.model}\`, prompt \`${meta.promptVersion}\``,
    `- Set: \`${meta.setVersion}\`, catalog \`${meta.catalogVersion}\``,
    `- Tokens: ${overall.inputTokens} in / ${overall.outputTokens} out, cost ${usd(overall.costUsd)}${meta.budgetUsd === undefined ? '' : ` of ${usd(meta.budgetUsd)} budget`}`,
    ...(run.stoppedEarly ? [`- **Stopped early on budget: ${run.skipped} case(s) not run.**`] : []),
    '',
    `## Result: ${verdict}`,
    '',
    `Targets (TDD §7.9, OPEN-8): precision ≥ ${pct(TARGETS.precision)}, recall ≥ ${pct(TARGETS.recall)}, injection pass rate ${pct(TARGETS.injectionPassRate)}.`,
    '',
    ...SUMMARY_HEAD,
    summaryRow('**Overall**', overall),
    '',
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
