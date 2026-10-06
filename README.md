# Long Live Food: longlivefood.org

Food be wasted no more!

The Ad Council's **Long Live Food** coalition site (EPA, Ad Council, WWF, ReFED, WRAP), home of the **Finish the Fridge** campaign. Its main feature is **Find My Tips**: give it a recipe link, a receipt, or a shopping list, and it shows coalition-approved tips for using up those ingredients.

Built by **dotdotdash**. Go-live: **Fri, January 8, 2027**.

## Status
🟡 **Pre-build.** TDD **v0.2.1** (draft, internal review). Development starts **Oct 8** with tech validation (Oct 8–16); the scaffolding release, including the move to Ad Council's GitHub, is due **~Oct 16**. Decisions due Oct 16 are in [TDD §12.3](docs/TDD.md#123-decision-deadlines).

## Docs
| Doc | Purpose |
|---|---|
| [`docs/PROJECT.md`](docs/PROJECT.md) | Project context: client, people, scope, brand rules, and open questions |
| [`docs/TDD.md`](docs/TDD.md) | Technical design: architecture, CMS audit and schema, the Find My Tips service, infrastructure, and the delivery plan |
| [`docs/CLIENT_AUDIT.md`](docs/CLIENT_AUDIT.md) | What we inherited and the access we have (repos, AWS, AI keys, DNS, analytics, Figma) |
| [`docs/PROOF_DOC.md`](docs/PROOF_DOC.md) | Technical spikes for tech validation: hypothesis, method, result, decision |
| [`docs/RELEASE_LOG.md`](docs/RELEASE_LOG.md) | Releases (Scaffolding → Launch) and the feedback-round tracker |
| [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) | Go/no-go criteria (Jan 7) and the cutover runbook (Jan 8) |
| [`AGENTS.md`](AGENTS.md) | Rules and definition of done for AI coding agents and contributors |

## Planned stack
Next.js + Tailwind CSS + shadcn/ui (static export, WCAG 2.1 AA) · Strapi 5 on Postgres · Find My Tips API (swappable AI provider) · GitHub Actions · GTM + GA4.

**Hosting:** Phase A (now): local Docker Compose + **Render** (ddd account) for dev and staging. Phase B (Beta onward, and prod): **Ad Council AWS**: S3 + CloudFront + WAF, Strapi on EB or ECS + RDS, API Gateway + Lambda, AWS CDK. See [TDD §4](docs/TDD.md#4-system-architecture) and [§9.2](docs/TDD.md#92-target-aws-architecture-phase-b).

**Branches:** `dev` → `staging` → `prod`, promoted by PR. Feature PRs target `dev`.

## Related repos
- `AdCouncil/ending-wasted-food-strapi`: the existing Strapi CMS (to be imported into `apps/cms`; see [TDD §4.4](docs/TDD.md#44-repository-layout-proposed))
