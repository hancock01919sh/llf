# Recommendation: AI provider for Find My Tips

**Due:** before Nov 13 · **Closes:** OPEN-1 · **Author:** Art Longbottom · **Status:** template

## Recommendation

[Vendor, model, and settings], at about [$X] a month at 50K uses ([$Y] at 25K).

## How we chose

TDD [D24](../../TDD.md#14-decision-log): the cheapest cell that meets G2 (precision ≥ [0.9], recall ≥ [0.8]), resists every injection case, and forecasts under the ~$500/month cap.

## Scorecard

Run: `eval/reports/arena-[stamp].md` · Set: [name, size] · Prompt: [version] · Prices checked on: [date]

| Cell | Precision | Recall | Readable / not food | Injection | p50 / p95 | $/use | $/month at 50K | Pass |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

## 12-month forecast and break-even

[Monthly and total spend for the pick at 25K and 50K uses. The maximum uses a month under the cap. Where the pick stops being the cheapest passing option.]

## Safety pre-check

[Cost and quality with and without the pre-check (`callsPerUse` 1 vs 2), and the UX decision.]

## Data handling

[Summary from [`legal-data-handling.md`](legal-data-handling.md), with the vendor answers.]

## Cost controls

[Settings from [`cost-controls.md`](cost-controls.md) for the chosen vendor.]

## Risks

- [Price changes, model deprecation, rate limits at peak, accuracy on real photos vs the test set]

## Approvals

| Approval | Who | Date |
|---|---|---|
| Vendor (IT) | | |
| Data handling (Legal) | | |
| Budget | | |

## After sign-off

1. Update TDD [§7.7](../../TDD.md#77-provider-abstraction) and [§9.5](../../TDD.md#95-cost-estimate), and close OPEN-1 in [§15](../../TDD.md#15-open-questions).
2. Record the result in [`PROOF_DOC.md`](../../PROOF_DOC.md) P9.
3. Set `AI_PROVIDER` and `AI_MODEL` per environment, and set up the production key and caps.
