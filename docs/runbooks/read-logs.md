# Runbook: read logs

**Status:** first draft for review (BD3244-18). Local steps are verified against the repo. Render and AWS steps are pending BD3244-15 and BD3244-6.

## Purpose
Find out what a service did, without exposing user data.

## Rules for logs
- Logs are structured JSON with a `requestId`. Retention is 30 days ([TDD §9.4](../TDD.md#94-observability-and-alerting)).
- The tool logs one JSON line per request: counts, codes, latency, provider, model, prompt version, token usage, and a URL hash.
- **No request bodies, user URLs, images, text, or terms are logged, ever** (D20). If you find one, treat it as a bug: open a P1 ticket, and don't copy it into Jira or Slack.
- Don't paste log lines with tokens, cookies, or secrets anywhere.

## Who
Developers and tech leads. The China team gets Render workspace seats only when they need logs.

## Local

### Web, tool, and CMS from `pnpm dev`
Each process prints to the terminal where you started it, prefixed `web`, `tool`, and `cms`. Run one at a time to isolate noise:
```sh
pnpm dev:fe                              # web + tool
pnpm --filter @llf/find-my-tips dev      # tool only
pnpm dev:cms                             # Postgres + Strapi
```

### Postgres
```sh
docker compose logs -f postgres
docker compose ps
```

### Find a request
The tool prints a `requestId` in every response (`curl -s … | jq .requestId`). Search the terminal output for that ID.

## Render (Phase A)
Pending BD3244-15.
1. Open the Render workspace → project `llf` → environment (`dev` or `staging`) → the service: `llf-web-<env>`, `llf-tips-<env>`, `llf-cms-<env>`, or `llf-db-<env>`.
2. **Logs** shows the live stream. Filter by text (`requestId`) or time. **Events** shows deploys and failures.
3. Build failures are in the deploy's own log, not the runtime log.

## AWS (Phase B)
Pending BD3244-6.
- **CloudWatch Logs** for the ECS services: `web` (pages, `/api/find-tips/*`, and the publish hook) and `cms` (Strapi). Search by `requestId` with Logs Insights.
- **GitHub Actions** for builds and deploys.
- **CloudFront and WAF logs** are kept 30 days, with the query string and `authorization` / `cookie` headers redacted. User text never goes in a URL.

## What to look for
| Symptom | Where |
|---|---|
| Tool errors, 5xx | Tool logs: the `code` field (`upstream_error`, `url_not_allowed`, `unavailable`, and so on) |
| Slow requests | Tool logs: latency. The alarm is p95 above 12 s for 15 min on AWS |
| Quota or mode changes | Tool logs and the Slack alert |
| Publish or build failures | [publish-fails](./publish-fails.md) |
| Blocked recipe sites (`source_unavailable`) | Expected for about 40% of URLs. Counted separately |

## Verification
You can tie a user-reported problem to a `requestId`, or show that the logs have no relevant entry.

## Rollback
Not applicable. Reading logs changes nothing.

## Escalation
Tech lead → James Steele for log access or retention issues on Render or AWS.
