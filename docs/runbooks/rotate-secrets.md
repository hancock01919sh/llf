# Runbook: rotate secrets

**Status:** first draft for review (BD3244-18). Render steps are pending BD3244-15. AWS steps are pending INFRA-AWS (BD3244-6) and the GitHub org move (OPEN-11).

## Purpose
Replace a secret on schedule, after someone leaves the team, or after a suspected leak, without an outage.

**Never write a secret value in Jira, Slack, a PR, a doc, or a commit.** This runbook names secrets only. Values live in Render env groups and AWS Secrets Manager, and the client's vault holds the owner list.

## When to use it
| Trigger | What to rotate |
|---|---|
| Every quarter | Origin-verify secret (dual-accept), webhook secret, GitHub App private key |
| Someone leaves the team | Strapi API tokens, the Render env group values they could see, Render deploy hooks |
| Suspected leak of any secret | That secret, now |
| Client AI key goes live | Revoke ddd's Anthropic key. Gemini and any test keys get the same treatment when their phase ends |
| Render shutdown (~Jan 22) | Every secret that lived on Render |

## Who
A tech lead, with James Steele for AWS. Ad Council IT owns the client's AI account.

## Prerequisites
- Access to the Render env groups (`llf-dev`, `llf-staging`) and, on AWS, Secrets Manager and SSM for the environment.
- A password manager or the client's vault for the new values. Don't use chat.
- Tell the team before you start, so nobody panics at a short blip.

## Secrets inventory
| Secret | Lives in | Notes |
|---|---|---|
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `DATABASE_*` | Render env group / Secrets Manager | Strapi. Rotating `APP_KEYS` signs out admins. Rotating the salts invalidates **all** API tokens |
| Strapi read-only API token (`CMS_TOKEN`) | Render env group / GitHub Environment secret | Used by the site build |
| Strapi full-access seed or transfer token | Nowhere. Short-lived | Create for the run, revoke after |
| Webhook secret | Strapi webhook config and the relay's secret | Phase B |
| Render deploy-hook URLs | Strapi webhook config and the Render env group | Phase A |
| Origin-verify secret (`x-origin-verify`) | CloudFront and the API's authorizer | Phase B. Dual-accept during rotation |
| GitHub App private key | Secrets Manager (relay) | Phase B |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` | Render env group / Secrets Manager | See [swap-ai-provider](./swap-ai-provider.md) |
| `BASIC_AUTH` | Render env group | Dev and staging only |

## Steps

### A. A Strapi API token
1. In the Strapi admin: **Settings → API Tokens**. Create a new token of the same type and a clear name.
2. Put the value in the Render env group (`CMS_TOKEN`) or the GitHub Environment secret. Phase B: Secrets Manager.
3. Trigger a site build ([publish-fails](./publish-fails.md), step 2.5 or 3.5) and confirm it succeeds.
4. Delete the old token.

### B. A Render deploy hook (Phase A)
1. In Render: the service's **Settings → Deploy Hook** → regenerate.
2. Update the Strapi webhook (Settings → Webhooks) and the Render env group with the new URL.
3. Use **Trigger** on the webhook. The old URL stops working immediately, so a failed trigger means the new one is wrong.

### C. An AI provider key
1. In the provider console, create a new key in the **same project or workspace** (with the same spend limit).
2. Set it in the env group or Secrets Manager. Render restarts the service. On AWS, force a new deployment of the ECS service so the tasks pick it up. Pending BD3244-6.
3. Verify with a test input (see [swap-ai-provider](./swap-ai-provider.md) verification).
4. Revoke the old key in the provider console.

### D. The origin-verify secret (Phase B, quarterly)
> Pending BD3244-6.

1. Add the new secret as the **current** value, and keep the old one as **previous**. The authorizer accepts both.
2. Update CloudFront's `x-origin-verify` header to the new value. Deploy.
3. Check a request through the site works, and that a direct call without the header fails with 403.
4. Remove the previous value.

### E. The webhook secret (Phase B)
> Pending BD3244-6.

1. Update the secret in Secrets Manager, then in the Strapi webhook header, close together.
2. Trigger the webhook and confirm a `deploy-site` run starts.

### F. The GitHub App private key (Phase B)
> Pending BD3244-6 and OPEN-11 (the App is created on Ad Council's org after the move).

1. In the App settings, **generate a new private key**. Store it in Secrets Manager.
2. Deploy so the relay uses it. Trigger a publish and confirm the run starts.
3. Delete the old key from the App settings.

### G. When someone leaves
1. Remove them from the GitHub repo, Render workspace, and the CMS (Settings → Users).
2. Rotate A and B above. Rotate the Render env group values they could see.
3. Remove them from the IP allow-list ([cms-ip-allow-list](./cms-ip-allow-list.md)).

## Verification
- The site build, the tool status endpoint, and a test extract all work.
- The old secret fails (token returns 401, hook returns 404 or 401).
- `git log -p` and a search of the PR show no secret value was committed. GitHub secret scanning with push protection is on.

## Rollback
Keep the old value until the new one is verified, except in a suspected leak. If the new value breaks things, put the old one back, and plan the rotation again.

## Escalation
Tech lead → James Steele → Ad Council IT for anything on the client's accounts. Report a confirmed leak to Danish the same day.
