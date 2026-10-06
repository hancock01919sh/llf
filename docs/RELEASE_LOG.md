# Release Log and Feedback Tracker: Long Live Food

Every build that someone outside the dev team sees gets an entry here. Feedback rounds are tracked in **Jira**; this file links to them. Under the ddd Tech Process this is owned by tech. Dates come from [TDD §12](./TDD.md#12-delivery-plan).

| | |
|---|---|
| **Owner** | Art Longbottom (tech lead), with Danish Aziz (PM) |
| **Jira project** | _TBD_ |

## Releases

| Release | Target date | Environment | Tag | Audience | What's in it | Status |
|---|---|---|---|---|---|---|
| **Scaffolding** | ~Oct 16 | dev (Render) | — | ddd | Monorepo, CI, Render dev live, **synthetic fixture seed**, mock tool end to end. Repo on Ad Council's GitHub; China team has access (if the move slips, TDD R6) | ⏳ |
| **Alpha** | ~Nov 11 | dev (Render) | — | ddd | **Skeleton**: every route and module type renders on the project seed, tool end to end on the dev key, all CMS types. Feature-complete follows on Nov 18 | ⏳ |
| **Beta** (Ready for UAT) | **Dec 8** | staging (**AWS**) | — | ddd QA, TBWA, Ad Council, coalition | Feature-complete, tracking in place, real content | ⏳ |
| **RC** | Dec 23 | staging (AWS) → **prod (AWS, dark)** | `v2026.12.23-1` | Ad Council | UAT and coalition fixes, content frozen in staging. First `staging` → `prod` merge; code and infra deployed dark. Prod site release built after the Jan 4 content transfer | ⏳ |
| **Launch** | **Jan 8** | prod (AWS) | — | Public | Go/no-go passed ([`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md)) | ⏳ |

Tags follow `vYYYY.MM.DD-n` on `prod` merges (TDD §9.3). Add a row for every hotfix.

## Feedback rounds

| Round | Dates | Who | Channel | Jira filter | Triage owner | Notes |
|---|---|---|---|---|---|---|
| Internal QA | Nov 19 – Dec 7 | ddd + QA vendor | Jira | _TBD_ | Danish | Functional and visual |
| TBWA UAT | Dec 8–10 (fixes Dec 11–15) | TBWA | Jira | _TBD_ | Danish | |
| Ad Council UAT | Dec 16–17 | Ad Council | Jira or spreadsheet (OPEN-29) | _TBD_ | Danish | Spreadsheet items are copied into Jira |
| Coalition review | Dec 18 (feedback due) | Coalition | Jira or spreadsheet (OPEN-29) | _TBD_ | Danish | **Development bugs only, no design feedback** |
| Ad Council fixes | Dec 21–23 | ddd | Jira | _TBD_ | Art | |
| Final QA + security | Jan 4–7 | ddd + Omnicom IT | Jira | _TBD_ | Art | Security, failover, load, harness |

**Severity** (TDD §11.3): **P1** blocks launch · **P2** fixed before launch or agreed workaround · **P3** post-launch backlog.

## Entry template

```md
### <Release> — <YYYY-MM-DD>
- **Environment / URL:** 
- **Commit / tag:** 
- **Content snapshot:** (e.g. seed v3, or staging as of <date>)
- **What's new:** 
- **Known issues:** (Jira links)
- **Feedback round:** (link to the row above)
```
