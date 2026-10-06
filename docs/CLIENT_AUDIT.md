# Client Audit: Long Live Food

What we inherited from TBWA and Ad Council, and the access we actually have. Under the ddd Tech Process this is a **Discovery** artifact owned by tech. Update it whenever access changes. Open items link to [TDD §15](./TDD.md#15-open-questions).

| | |
|---|---|
| **Owner** | Art Longbottom (tech lead) |
| **Last updated** | 2026-10-06 |
| **Sources** | Handoff and project notes ([`PROJECT.md`](./PROJECT.md)), Strapi repo audit ([TDD §5.1](./TDD.md#51-audit-of-the-existing-strapi-repo)), kickoff (full transcript), weekly status (Oct 5) |

Status key: ✅ usable · ⚠️ partial or blocked · ❌ missing · ➖ not needed yet

## 1. Systems and access

| System | What exists | Access we have | Gap / ask | Owner | Status |
|---|---|---|---|---|---|
| **Strapi repo** | `AdCouncil/ending-wasted-food-strapi` @ `f753967`. Strapi 5.45 (JS), SQLite, local media, Cloud plugin. Closer to a prototype than deploy-ready | Read (cloned and audited) | Imported into our monorepo with `git subtree` (TDD §4.4) | Ad Council | ✅ |
| **Frontend repo** | **None.** Dan's prototype frontend was never committed | — | We build `apps/web` from scratch against Figma | — | ❌ |
| **Content** | Dan's entries lived in his local SQLite. Nothing in the repo | — | Ask TBWA for a `strapi export` (OPEN-13). Don't wait: seed by scrape → JSON → import (OPEN-30) | TBWA / Ad Council | ❌ |
| **Our repo** | `dotdotdashdev/3244_tbw_ad_counsel` (this repo), private | ddd admin | Move to Ad Council's GitHub org by Oct 16. China team gets access after the move (OPEN-11) | ddd → Ad Council | ⚠️ |
| **Figma** | "Food Waste I Design R2": Desktop, Mobile, Design System pages. Toolkit desktop delivered Sep 30; mobile is ddd's adaptation | View-only. Figma MCP connected, but a View seat allows only ≈ 20 MCP calls a month. The file sits in the **MullenLowe org**, which has no file admins (Amber is the org admin; Colleen filed a ticket, and Sam can file future ones) | Move the file to an org where ddd has a Full or Dev seat, such as TBWA Worldwide (OPEN-33, TDD R17), then run the module-by-module audit (OPEN-10) | Colleen Miller / Sam + ddd | ⚠️ |
| **AWS** | Ad Council account. TBWA planned CodePipeline → Elastic Beanstalk. **Nothing deployed** | James C has a **real IAM user** (not SSO): it can create a CodeBuild project but **can't list users or pipelines**. James S is checking whether his account has admin. Danish's account is on hold | Scoped access: SSO ReadOnly + tag-scoped project admin, GitHub OIDC deploy role, DNS contact (OPEN-3, TDD §9.1). Asked via Danish → Cat. The China team doesn't need AWS for weeks | Ad Council IT | ⚠️ |
| **Strapi environments** | None deployed | — | Phase A: Render (ddd). Phase B: Ad Council AWS | ddd / James S | ❌ |
| **Render** | ddd workspace | ddd admin | Ad Council IT to accept dev/staging on ddd's account with test content (OPEN-23). **PR previews** on the dev web service give the China team a shareable link per PR; Render seats for logs only when needed (TDD §9.1) | ddd | ⚠️ |
| **AI: OpenAI** | TBWA's test key, **$20 hard cap**. No client production account | Test key only | IT approval + client account. Production provider decision due Nov 13 (OPEN-1) | Ad Council | ⚠️ |
| **AI: Anthropic** | ddd's own account | ddd admin | IT to accept dev use with test inputs only (OPEN-2) | ddd | ⚠️ |
| **DNS** | `longlivefood.org` and the finishthefridge domains | None | Named contact or Route 53 delegation; CMS domain name (OPEN-20) | Ad Council IT | ❌ |
| **Analytics** | Unknown whether a GTM container / GA4 property exists | None | Ownership, consent, and scope beyond the basic embed (OPEN-18, OPEN-27) | Ad Council + Adam P | ❌ |
| **Jira** | ddd Jira project for dev and QA | ddd admin | Ad Council / coalition feedback format (OPEN-29) | ddd | ✅ |
| **Slack / Asana** | Slack Connect with Ad Council. Ad Council uses Asana | ddd members | — | Ad Council | ✅ |
| **Images** | ≈ 20 lifestyle images (Ad Council iStock; AI only on request), ≈ 50 category images (stock first, AI backup), ingredient images (AI approved: Firefly, Nano Banana, optionally Magnific). Optional offline pipeline (LLF-IMAGES) | — | Separate workstream, ≈ 1 month (OPEN-28) | Colleen Miller | ➖ |
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
- Missing types and modules: Accordion, Modal, global nav/footer, scroll-lock, Tool Copy. Strings move to code, not a CMS type (TDD D21).
- `Ingredient.title` (not `name`); `synonyms` is a single string.
- No admin customization (the walkthrough's typeahead isn't in the repo).

## 4. Change log
| Date | Change |
|---|---|
| 2026-10-06 | First version, after the repo audit, weekly status, and kickoff |
| 2026-10-06 | Full kickoff transcript: AWS IAM-user facts, Figma org transfer (OPEN-33), Render PR previews, the three image types, strings to code (D21) |
