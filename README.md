# Long Live Food: longlivefood.org

Food be wasted no more!

The Ad Council's **Long Live Food** coalition site (EPA, Ad Council, WWF, ReFED, WRAP), home of the **Finish the Fridge** campaign. Its main feature is **Find My Tips**: give it a recipe link, a receipt, or a shopping list, and it shows coalition-approved tips for using up those ingredients.

Built by **dotdotdash**. Go-live: **Fri, January 8, 2027**.

## Status
🟡 **Scaffolding.** TDD **v0.3.10** (draft, internal review). The monorepo, web app, Find My Tips service, CI (BD3244-16), and the synthetic CMS seed (BD3244-24) are in place; deployment to Render and the move to Ad Council's GitHub come next. The scaffolding release is due **~Oct 16**. Decisions due Oct 16 are in [TDD §12.3](docs/TDD.md#123-decision-deadlines).

## Quickstart
**Prerequisites:** Node 22 (`nvm use` reads `.nvmrc`), pnpm 9 (`corepack enable` picks the version from `package.json`), and Docker (only for the CMS).

```sh
cp .env.example .env     # one root .env for every app
pnpm install
```

| Command | What runs | URLs |
|---|---|---|
| `CMS_FIXTURES=1 pnpm dev:fe` | Web + Find My Tips, content from `apps/web/fixtures/cms`. **No Docker, no Strapi.** Start here. | web http://localhost:3000, tool http://localhost:8787 |
| `pnpm dev` | Postgres (Docker) + Strapi + web + tool | adds Strapi admin http://localhost:1337/admin |
| `pnpm dev:cms` | Postgres + Strapi only | http://localhost:1337/admin |
| `pnpm seed` | Loads the synthetic fixtures into a running Strapi, publishes them, and verifies the result. Needs `CMS_URL` and a full-access `CMS_SEED_TOKEN` ([seed README](scripts/seed/README.md)) | — |

- Put `CMS_FIXTURES=1` in `.env` to make fixtures the default. Without it, web needs `CMS_URL` and `CMS_TOKEN` (a **read-only** Strapi API token: Strapi admin → Settings → API Tokens).
- `pnpm dev` and `pnpm dev:cms` create `apps/cms/.env` with random local-only secrets on first run. If Homebrew Postgres holds 5432, set `POSTGRES_PORT=5433` in `.env`.
- Find My Tips runs on the **mock** AI provider by default (`AI_PROVIDER=mock`): recorded fixtures, no keys, no network. Live providers are for Render dev and the manual `eval` suite only ([AGENTS.md](AGENTS.md)).
- Every env key is documented in [`.env.example`](.env.example). Never commit `.env`.

### Checks
```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test   # what CI's `checks` job runs
CMS_FIXTURES=1 pnpm build && pnpm e2e                            # what CI's `e2e` job runs (Playwright + axe)
```
First e2e run: `pnpm --filter @llf/web exec playwright install chromium`. `pnpm format` fixes formatting.

**CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs both jobs on every PR to `dev`, `staging`, and `prod`, and on pushes to `dev`. It uses the mock provider and CMS fixtures, so it needs no secrets. [`CODEOWNERS`](.github/CODEOWNERS) sets the required reviewers.

### Repo layout
| Path | What |
|---|---|
| `apps/web` | Next.js static export (`out/`) + `server.mjs` (static server and `/api/find-tips` proxy for local and Render) |
| `apps/cms` | Strapi 5 ([its README](apps/cms/README.md)) |
| `services/find-my-tips` | Find My Tips API: extraction (swappable AI provider), recipe URL fetch, catalog matching ([README](services/find-my-tips/README.md)) |
| `packages/contracts` | Zod schemas and types shared across apps: CMS shapes, Find My Tips API, analytics events |
| `packages/matching` | Ingredient normalization and catalog matching |
| `packages/ui` | shadcn/ui components and the Figma design tokens (`styles/tokens.css`) |
| `scripts/seed` | Synthetic CMS fixture seed: validate, upsert, publish, verify ([its README](scripts/seed/README.md)) |

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

## Stack
Next.js + Tailwind CSS + shadcn/ui (static export, WCAG 2.1 AA) · Strapi 5 on Postgres · Find My Tips API (swappable AI provider) · GitHub Actions · GTM + GA4.

**Hosting:** Phase A (now): local Docker Compose + **Render** (ddd account) for dev and staging. Phase B (Beta onward, and prod): **Ad Council AWS**: S3 + CloudFront + WAF, Strapi on EB or ECS + RDS, API Gateway + Lambda, AWS CDK. See [TDD §4](docs/TDD.md#4-system-architecture) and [§9.2](docs/TDD.md#92-target-aws-architecture-phase-b).

**Branches:** `dev` → `staging` → `prod`, promoted by PR. Feature PRs target `dev`.

## Related repos
- `AdCouncil/ending-wasted-food-strapi`: the existing Strapi CMS, imported into `apps/cms` with `git subtree` (see [its README](apps/cms/README.md) and [TDD §4.4](docs/TDD.md#44-repository-layout-proposed))
