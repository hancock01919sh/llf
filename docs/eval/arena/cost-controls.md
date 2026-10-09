# Cost controls by platform

Draft for the OPEN-1 recommendation (BD3244-37). Budget: about **$500/month** at 25K–50K uses.

> **Verify** marks vendor behavior we have not confirmed in the console. Check each one when the account exists and record the actual settings in [`CLIENT_AUDIT.md`](../../CLIENT_AUDIT.md).

## Vendor controls

| Control | Anthropic | OpenAI | Google (Gemini API / Vertex AI) | AWS Bedrock |
|---|---|---|---|---|
| Hard monthly spend cap | Workspace or org spend limit (Verify) | Project budget; check whether it blocks or only alerts (Verify) | No hard cap on the API; use a billing budget plus a quota (Verify) | No hard cap; use AWS Budgets actions or a service quota (Verify) |
| Spend alerts | Email on limit (Verify) | Budget alert thresholds (Verify) | Cloud Billing budget alerts | AWS Budgets / CloudWatch |
| Rate limits | Per-tier RPM and tokens per minute | Per-tier RPM and tokens per minute; per-project limits (Verify) | Per-project quotas, can be lowered | Service quotas per model and region |
| Key scoping | Workspace API keys | Project keys with restricted permissions | API key restrictions or a service account | IAM role only; no long-lived key |
| Usage reporting | Console usage and cost by key | Usage dashboard by project | Cloud Billing reports | Cost Explorer and CloudWatch |

## Our own controls

| Control | Where | Status |
|---|---|---|
| Per-IP rate limit (URL and model calls per window) | `rate-limit.ts`, `RATE_LIMIT_*` | Built (in memory; shared store with AWS) |
| Daily model-call budget per input type; degrades to JSON-LD only | `quota.ts`, `QUOTA_DAILY_MODEL_CALLS` | Built |
| Kill switch (tool shows the "unavailable" Tool Copy) | Tool Copy state; ops switch | Copy defined; ops switch [PROPOSED] |
| WAF rate rules in front of the tool | AWS WAF (TDD [§7.6](../../TDD.md#76-abuse-cost-and-security-controls)) | Planned for AWS |
| Request and upload size limits | `config.ts`, `http.ts`, `url/safe-fetch.ts` | Built |
| Downscale images to ≤1 MP before the model call | Image path | **Not built** |
| Output token ceiling | `extract/anthropic.ts`, `extract/openai.ts` | Built |
| Recipe URL cache (hash plus extracted terms) | `cache.ts`, `url/pipeline.ts` | Built |
| Per-cell and global eval budgets | `pnpm arena` | Built |

## Recommendations

1. Use a **dedicated project or workspace** for production, separate from dev and eval keys.
2. Set the vendor's **hard cap** (or the nearest equivalent) at about [$600], with alerts at [50%, 80%, 100%] of $500.
3. Set `QUOTA_DAILY_MODEL_CALLS` so that a full month of the daily limit stays under the cap at the chosen model's cost per use.
4. Ship the ≤1 MP resize before launch, so image cost matches the forecast.
5. James Steele sets up the accounts, caps, and alerts, and records them in [`CLIENT_AUDIT.md`](../../CLIENT_AUDIT.md). Cost assumptions roll into TDD [§9.5](../../TDD.md#95-cost-estimate).
