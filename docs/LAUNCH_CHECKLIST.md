# Launch Checklist: Long Live Food

Go/no-go criteria and the cutover runbook. **Go/no-go: Thu Jan 7, 2027. Launch: Fri Jan 8, 2027.** There's no contingency after final QA (Jan 4–7), so anything not ready is cut or deferred, not slipped. Details are in [TDD §11.6](./TDD.md#116-launch-and-handoff) and [§12](./TDD.md#12-delivery-plan).

| | |
|---|---|
| **Owner** | Art Longbottom (tech lead), with Danish Aziz (PM) and James Steele (AWS) |
| **Sign-off** | Ad Council (Cat Boyce), Omnicom IT, ddd tech and production |

## 1. Go/no-go criteria (Jan 7)

### Quality
- [ ] No open **P1**. Every open **P2** has an agreed workaround (Jira filter linked in [`RELEASE_LOG.md`](./RELEASE_LOG.md))
- [ ] QA vendor functional and visual regression passed on prod infrastructure
- [ ] Accessibility: axe clean on every route and tool state; manual VoiceOver and NVDA passes done
- [ ] Lighthouse budgets met (TDD §6.8)
- [ ] Eval on the production provider meets the agreed bar (OPEN-8), with a 100% injection pass rate

### Security and resilience (Omnicom IT)
- [ ] Security testing signed off (plus the pen test, if required: OPEN-21)
- [ ] Failover: previous release still serves when a build fails; tool degrades to `jsonld-only` and `off`; RDS point-in-time restore rehearsed
- [ ] Load test at the expected PSA spike passed
- [ ] Harness testing signed off
- [ ] CMS admin reachable **only** from allow-listed IPs; Public role has no permissions
- [ ] No secrets in the repo, Jira, or docs; all production secrets in Secrets Manager

### Infrastructure
- [ ] Prod stacks deployed and smoke-tested **dark** (RC code from Dec 23; site release rebuilt on prod content after Jan 4)
- [ ] Tool API rejects direct calls without the origin header; the `execute-api` endpoint is disabled (TDD §7.6)
- [ ] DNS records prepared; TTL lowered at least a week before (OPEN-20)
- [ ] TLS certificates issued for every domain
- [ ] WAF rules, Bot Control, and Challenge active on prod
- [ ] Alarms and notifications verified (TDD §9.4); on-call rota for Jan 8–10 and hypercare agreed
- [ ] Rollback rehearsed: release pointer switch, and DNS back to the holding page

### Tool and AI
- [ ] Production AI key in place (OPEN-1); US-only data handling and no-training terms confirmed
- [ ] Legal has confirmed what "US-only" covers, including the global CloudFront/WAF edge (OPEN-31); if end to end, the tool API runs on the regional setup (TDD §9.1)
- [ ] Daily quota and kill switch set and tested; provider budget alerts configured
- [ ] Status endpoint reports the right mode

### Content and analytics
- [ ] Content transferred staging → prod on Jan 4 and checked (TDD §5.5)
- [ ] Category images final (OPEN-28)
- [ ] Privacy policy and FAQ copy match the data handling (OPEN-5)
- [ ] GTM/GA4 production IDs set; events verified in GA4 DebugView; no user text in any event, and `page_location` is sanitized (TDD §8)
- [ ] `robots.txt`, sitemap, and canonical URLs correct for prod

### Handoff
- [ ] Editors trained (recording + written guide)
- [ ] O&M inputs delivered (TDD §9.6); as-built TDD updated
- [ ] Credential and owner list stored in the client's vault (**never in docs**)

## 2. Cutover runbook (Jan 8)

| # | Step | Who | Done |
|---|---|---|---|
| 1 | Confirm go decision from Jan 7; announce the start in Slack | Danish | [ ] |
| 2 | Confirm the prod release pointer is on the **final QA build** (the `prod` tag that passed Jan 4–7, built from prod content) | Art | [ ] |
| 3 | Switch DNS for `longlivefood.org` (and redirects for the finishthefridge domains) to CloudFront | James S / Ad Council IT | [ ] |
| 4 | Smoke test: every route, tool on every input type, 404, redirects, analytics in debug | Art + QA | [ ] |
| 5 | Check alarms, WAF, and quota dashboards | James S | [ ] |
| 6 | Announce launch | Danish | [ ] |

**Rollback:** switch the release pointer back to the previous build; if the platform itself is broken, point DNS back to the holding page. Decision owner: Art, with Cat informed.

## 3. Hypercare (Jan 8–22)
- [ ] Daily check of alarms, errors, AI spend, and quota
- [ ] P1 response on call, including the Jan 9–10 weekend
- [ ] Render shutdown after hypercare (TDD §12.2): final export, delete services, rotate secrets, revoke ddd's Anthropic key
