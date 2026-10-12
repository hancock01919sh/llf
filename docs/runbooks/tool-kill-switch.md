# Runbook: turn Find My Tips off, or to JSON-LD only

**Status:** first draft for review (BD3244-18). The service-side switch is built. The Render and AWS parts are pending BD3244-15 and BD3244-6.

## Purpose
Stop or limit model calls from the tool without a code change. Use it to cap spend, contain abuse, or ride out a provider outage.

## When to use it
- AI spend or usage is climbing faster than planned, or a provider budget alert fired (50%, 80%, 100%).
- The daily quota ran out and you want to hold the mode for the rest of the day.
- Abuse or a suspected prompt-injection problem.
- The provider is down or returning errors.
- A privacy concern about what the tool handles. Turn it off first and ask questions after.

## Who
Any tech lead. It's a safe action: turning the tool off never loses data. Tell Danish afterwards.

## The three modes
`FIND_TIPS_MODE` ([TDD §7.6](../TDD.md#76-abuse-cost-and-security-controls), [service README](../../services/find-my-tips/README.md)):

| Mode | Behavior |
|---|---|
| `live` | Normal. Recipe URLs use JSON-LD first, then the model. Text and images use the model. |
| `jsonld-only` | No model calls. Recipe URLs with JSON-LD still work. |
| `off` | Every extract call returns 503 `unavailable`. |

The UI reads `/api/find-tips/status` and shows the Unavailable state when the tool is off. That copy comes from site strings and Tool Copy, never from the model.

The daily quota (`QUOTA_DAILY_MODEL_CALLS`, default 3000 per input type per UTC day) also degrades the service on its own. When a type's budget is spent, URLs fall back to JSON-LD only, and text or image return 503.

## Prerequisites
- **Phase A (Render):** access to the Render workspace and the `llf-<env>` environment group. Pending BD3244-15.
- **Phase B (AWS):** permission to write SSM parameters in the environment's account. Pending BD3244-6.
- **Local:** your root `.env` (git-ignored).

## Steps

### Phase A: Render
1. In the Render workspace, open the `llf-<env>` **environment group**.
2. Set `FIND_TIPS_MODE` to `jsonld-only` or `off`.
3. Save. Render restarts the linked `llf-tips-<env>` service. In Phase A the mode is read from the environment at startup, so it needs the restart.
4. Wait for the deploy to finish.

### Phase B: AWS
> Pending BD3244-6. The parameter path isn't defined yet.

1. Set the SSM parameter `FIND_TIPS_MODE` for the environment:
   ```sh
   aws ssm put-parameter --name <FIND_TIPS_MODE_PARAMETER_PATH> --value off --type String --overwrite
   ```
2. The API reads the parameter on every request and caches it for **30 seconds**. No deploy is needed.

### Local
Set `FIND_TIPS_MODE=off` in `.env` and restart `pnpm dev:fe` (or `pnpm dev`).

## Verification
1. Check the status endpoint:
   ```sh
   curl -s https://<tool-host>/api/find-tips/status
   curl -s localhost:8787/api/find-tips/status    # local
   ```
   `mode` should show your setting.
2. Open the Find My Tips page and confirm the Unavailable state (mode `off`).
3. In `jsonld-only`, a text submission should fail as unavailable, and a recipe URL with JSON-LD should still work.
4. Check the provider console that spend stops rising.

## Turning it back on
1. Fix or confirm the cause (spend, abuse, provider status).
2. If the quota was the cause, change `QUOTA_DAILY_MODEL_CALLS` only on purpose, and record why in the incident notes.
3. Set `FIND_TIPS_MODE=live` the same way and run the verification again.

## If a spend cap is breached
Provider budgets and AWS Budgets **alert but don't hard-cap**. The hard limits are the quota and this switch ([TDD §7.6](../TDD.md#76-abuse-cost-and-security-controls), [cost controls](../eval/arena/cost-controls.md)).
1. Set the mode to `off`, or `jsonld-only` if you want recipe URLs with JSON-LD to keep working.
2. Check the provider console for usage by key. On AWS, check the WAF dashboard for a traffic spike.
3. If a key may have leaked, follow [rotate-secrets](./rotate-secrets.md) before turning the tool back on.
4. Lower `QUOTA_DAILY_MODEL_CALLS` if legitimate traffic caused it, then go back to `live`.
5. Record the spend, cause, and new limits in the incident notes. Update [`CLIENT_AUDIT.md`](../CLIENT_AUDIT.md) if a vendor limit changed.

## Rollback
This is the rollback. Reverse it by setting the mode back to `live`.

## Escalation
Tech lead → Danish (PM) → Ad Council (Cat) if production was affected for more than a short time, or a budget was breached.
