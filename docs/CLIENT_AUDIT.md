# Client Audit: Long Live Food

What we inherited from TBWA and Ad Council, and the access we actually have. Under the ddd Tech Process this is a **Discovery** artifact owned by tech. Update it whenever access changes. Open items link to [TDD §15](./TDD.md#15-open-questions).

| | |
|---|---|
| **Owner** | Art Longbottom (tech lead) |
| **Last updated** | 2026-10-06 |
| **Sources** | Handoff and project notes ([`PROJECT.md`](./PROJECT.md)), Strapi repo audit ([TDD §5.1](./TDD.md#51-audit-of-the-existing-strapi-repo)), kickoff (partial transcript), weekly status (Oct 5) |

Status key: ✅ usable · ⚠️ partial or blocked · ❌ missing · ➖ not needed yet

## 1. Systems and access

| System | What exists | Access we have | Gap / ask | Owner | Status |
|---|---|---|---|---|---|
| **Strapi repo** | `AdCouncil/ending-wasted-food-strapi` @ `f753967`. Strapi 5.45 (JS), SQLite, local media, Cloud plugin. Closer to a prototype than deploy-ready | Read (cloned and audited) | Imported into our monorepo with `git subtree` (TDD §4.4) | Ad Council | ✅ |
| **Frontend repo** | **None.** Dan's prototype frontend was never committed | — | We build `apps/web` from scratch against Figma | — | ❌ |
| **Content** | Dan's entries lived in his local SQLite. Nothing in the repo | — | Ask TBWA for a `strapi export` (OPEN-13). Don't wait: seed by scrape → JSON → import (OPEN-30) | TBWA / Ad Council | ❌ |
| **Our repo** | `dotdotdashdev/3244_tbw_ad_counsel` (this repo), private | ddd admin | Move to Ad Council's GitHub org by Oct 16. China team gets access after the move (OPEN-11) | ddd → Ad Council | ⚠️ |
| **Figma** | "Food Waste I Design R2": Desktop, Mobile, Design System pages. Toolkit desktop delivered Sep 30; mobile is ddd's adaptation | View-only. Figma MCP configured, **OAuth pending** | Module-by-module audit (OPEN-10) | TBWA / Ad Council | ⚠️ |
| **AWS** | Ad Council account. TBWA planned CodePipeline → Elastic Beanstalk. **Nothing deployed** | Role for James S / James C / Art **can't list or describe anything** | SSO ReadOnly + tag-scoped project admin, GitHub OIDC deploy role, DNS contact (OPEN-3, TDD §9.1). Asked via Danish → Cat | Ad Council IT | ⚠️ |
| **Strapi environments** | None deployed | — | Phase A: Render (ddd). Phase B: Ad Council AWS | ddd / James S | ❌ |
| **Render** | ddd workspace | ddd admin | Ad Council IT to accept dev/staging on ddd's account with test content (OPEN-23) | ddd | ⚠️ |
| **AI: OpenAI** | TBWA's test key, **$20 hard cap**. No client production account | Test key only | IT approval + client account. Production provider decision due Nov 13 (OPEN-1) | Ad Council | ⚠️ |
| **AI: Anthropic** | ddd's own account | ddd admin | IT to accept dev use with test inputs only (OPEN-2) | ddd | ⚠️ |
| **DNS** | `longlivefood.org` and the finishthefridge domains | None | Named contact or Route 53 delegation; CMS domain name (OPEN-20) | Ad Council IT | ❌ |
| **Analytics** | Unknown whether a GTM container / GA4 property exists | None | Ownership, consent, and scope beyond the basic embed (OPEN-18, OPEN-27) | Ad Council + Adam P | ❌ |
| **Jira** | ddd Jira project for dev and QA | ddd admin | Ad Council / coalition feedback format (OPEN-29) | ddd | ✅ |
| **Slack / Asana** | Slack Connect with Ad Council. Ad Council uses Asana | ddd members | — | Ad Council | ✅ |
| **Images** | Category images: stock first, AI as backup, ≈ 20 (or 50) | — | Separate workstream, ≈ 1 month (OPEN-28) | Colleen Miller | ➖ |
| **QA vendor** | Functional and visual testing per the Tech Process | — | Which vendor and how they reach staging (OPEN-25) | ddd production | ➖ |
| **Omnicom IT** | Security, failover, load, and harness testing before launch | — | Contact and test plan (OPEN-26) | ddd production | ➖ |

## 2. Approved vendors

Any new SaaS or tool needs **Ad Council IT approval** first [CONFIRMED]. Approved so far: **GitHub, AWS, Strapi, OpenAI** (account pending). Pending acceptance for development only: **Render** and **Anthropic** on ddd's accounts. Don't add any other third-party runtime service without raising it in the TDD first.

## 3. Strapi repo findings (summary)

Full detail is in [TDD §5.1](./TDD.md#51-audit-of-the-existing-strapi-repo). The headlines:

- SQLite only; `pg` isn't installed → **Postgres everywhere** (TDD D13).
- No upload provider → Render disk in Phase A, S3 + CloudFront in Phase B.
- `@strapi/plugin-cloud` included → remove it (not an approved vendor).
- `webhooks.populateRelations` is a Strapi 4 setting → remove it.
- Several relations are declared one-way `oneToOne` / `oneToMany` where the intent is many-to-one or many-to-many → relation spike ([`PROOF_DOC.md`](./PROOF_DOC.md) P1).
- Missing types and modules: Strings/microcopy, Accordion, Modal, global nav/footer, scroll-lock, Tool Copy.
- `Ingredient.title` (not `name`); `synonyms` is a single string.
- No admin customization (the walkthrough's typeahead isn't in the repo).

## 4. Change log
| Date | Change |
|---|---|
| 2026-10-06 | First version, after the repo audit, weekly status, and kickoff |
