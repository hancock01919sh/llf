# Runbook: swap the AI provider or model

**Status:** first draft for review (BD3244-18). The adapters are built. The production provider is undecided (OPEN-1, due Nov 13). Render and AWS steps are pending BD3244-15 and BD3244-6.

## Purpose
Change `AI_PROVIDER`, `AI_MODEL`, or the prompt version with configuration only. No code change ([AGENTS.md](../../AGENTS.md)).

## When to use it
- The OPEN-1 decision picks a production provider or model.
- A model is deprecated, too costly, or too slow.
- The provider has an outage and a second provider is approved and configured.

## Who
A tech lead. Choosing the **production** provider is Ad Council's decision (OPEN-1). Don't enable a provider on production until Ad Council IT approved it (OPEN-2).

## Prerequisites
- The provider's key in the right place: the Render env group (dev and staging), or Secrets Manager (production). Names only: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`.
- A project-level spend limit set at the provider ([cost controls](../eval/arena/cost-controls.md)).
- Production requirements met and recorded in [`CLIENT_AUDIT.md`](../CLIENT_AUDIT.md): US-only processing and storage, no training on our data, shortest retention ([TDD §7.7](../TDD.md#77-provider-abstraction)).
- A passing eval for the candidate. Don't skip this step.

## Adapters
| `AI_PROVIDER` | Use | Key |
|---|---|---|
| `mock` | Local and CI (default) | none |
| `anthropic` | Dev, on ddd's key | `ANTHROPIC_API_KEY` |
| `openai` | Arena and eval only (not an authorized vendor) | `OPENAI_API_KEY` |
| `gemini` | Vertex AI in Ad Council's project (D37): dev on a bound key; staging and prod by Workload Identity Federation, no key | `GEMINI_VERTEX=1`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION` (`us`); `GEMINI_API_KEY` on dev only |
| `bedrock` | Stub until OPEN-1 | TODO(OPEN-1) |

Optional settings: `AI_REASONING_EFFORT` (`none`, `minimal`, `low`, `medium`, `high`) and `PROMPT_VERSION` (default `p1`). Never edit a prompt version that an eval already scored: add a new one in `services/find-my-tips/src/extract/prompt.ts`.

## Steps

### 1. Run the eval on the candidate
From the repo root (see the [service README](../../services/find-my-tips/README.md)):
```sh
pnpm eval -- --provider <provider> --model <model-id> \
  --price-in <usd-per-Mtok> --price-out <usd-per-Mtok> --budget 5 \
  --set eval/sets/<set>.json --strict
```
Add `--effort <level>` for reasoning models. `--strict` exits 1 when the run misses the G2 bar. For a side-by-side comparison with a $/month forecast, use `pnpm arena` (see [`docs/eval/arena/README.md`](../eval/arena/README.md)). Keep every run under the budget.

Only continue if the model meets the G2 target and the injection cases pass 100%.

### 2. Turn the tool down while you switch (production only)
Set `FIND_TIPS_MODE=jsonld-only` ([tool-kill-switch](./tool-kill-switch.md)) so no request hits a half-configured provider.

### 3. Change the configuration
- **Local:** edit `.env`: `AI_PROVIDER`, `AI_MODEL`, and optional `AI_REASONING_EFFORT`. Restart `pnpm dev:fe`.
- **Render dev or staging:** edit the `llf-<env>` env group. Render restarts the service. *Pending BD3244-15.*
- **AWS:** set the values in the stack's configuration or SSM, and the key in Secrets Manager, then deploy `deploy-service`. *Pending BD3244-6.* A model name change belongs in SSM and takes effect without a deploy.

The model name is part of the URL cache key, so cached recipe terms from the old model are not reused.

### 4. Check the new setup
```sh
curl -s localhost:8787/api/find-tips/status
curl -s -X POST localhost:8787/api/find-tips/extract -H 'content-type: application/json' \
  -d '{"inputType":"text","text":"milk, eggs, spinach, bananas"}'
```
Use your environment's host instead of `localhost:8787`. Use **test inputs only** on dev keys: no real receipts.

Expect `source: "model"` and sensible `matches`. A 502 with `upstream_error` means the key is missing or wrong.

### 5. Turn the tool back on
Set `FIND_TIPS_MODE=live` and check the logs and provider usage for 15 minutes.

### 6. Record it
Update [`CLIENT_AUDIT.md`](../CLIENT_AUDIT.md) (account, key owner, caps) and, if this is a design change, the TDD decision log. Revoke keys you no longer need ([rotate-secrets](./rotate-secrets.md)).

## Verification
- `status` shows the right `mode`.
- A test input of each type works (text, URL, and image where enabled).
- Spend shows up under the new key and stays inside the cap.

## Rollback
Put the previous `AI_PROVIDER`, `AI_MODEL`, and `AI_REASONING_EFFORT` back, and restart. If you're unsure which is healthy, use `FIND_TIPS_MODE=jsonld-only` while you fix it.

## Escalation
Tech lead → Danish → Ad Council (OPEN-1 owner) for any provider that isn't approved.
