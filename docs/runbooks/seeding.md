# Runbook: seed the CMS

**Status:** first draft for review (BD3244-18). The synthetic fixture seed is built (BD3244-24). The scraped project seed (P6, OPEN-30) and seeding Render dev (BD3244-15) are pending.

## Purpose
Load content into a fresh CMS so the site has something to render and test against. Full details are in the [seed README](../../scripts/seed/README.md).

**The fixtures are synthetic. Never seed them into staging or production.** Real content moves between environments with [transfer-content](./transfer-content.md).

## When to use it
- A new local database, a new Render dev environment, or a PR preview that needs content.
- After a schema change, to prove the content model still works.

## Who
Developers (local), a tech lead (Render dev).

## Prerequisites
- A running Strapi: `pnpm dev:cms` ([run-locally](./run-locally.md)).
- A **full-access** Strapi API token, created for this run. Never commit it, and never put it in Jira, Slack, or a PR.

## Steps
1. Validate the fixtures without touching a CMS:
   ```sh
   pnpm seed --dry-run
   ```
2. Create a token. In the admin (<http://localhost:1337/admin>): **Settings → API Tokens → Create new API token**, type **Full access**. Copy the key once. (A shell route also exists: see the seed README.)
3. Report what would change:
   ```sh
   CMS_URL=http://localhost:1337 CMS_SEED_TOKEN=<token> pnpm seed --dry-run
   ```
4. Run the seed. It upserts by natural key, publishes, and verifies by reading the content back with the site's schema:
   ```sh
   CMS_URL=http://localhost:1337 CMS_SEED_TOKEN=<token> pnpm seed
   ```
   Pass the token inline for one run. Re-running updates entries and never duplicates them.
5. **Revoke the token** in the admin (Settings → API Tokens → delete).
6. Create a **read-only** token if you want the web app to build from the CMS instead of fixtures. Set it as `CMS_TOKEN` in `.env`, with `CMS_URL`, and unset `CMS_FIXTURES`.

For Render dev (Pending BD3244-15): run the same command with that environment's `CMS_URL` and a short-lived token created in its admin, from an allow-listed IP.

## Verification
- The seed prints a verify pass. A first run against local Strapi 5.45 created 43 entries covering every block and template route.
- The admin shows ingredients, tips, groups, categories, and pages.
- `pnpm build` (without `CMS_FIXTURES`) succeeds against the CMS.

## Gotchas
- Port 5432 busy: set `POSTGRES_PORT=5433` in `.env`, delete `apps/cms/.env`, rerun `pnpm dev:cms`.
- Use `curl -g` when a query string has square brackets.
- Images aren't seeded (OPEN-28). Image fields stay empty.

## Rollback
Local: reset the database ([run-locally](./run-locally.md), Rollback). Deployed dev: delete the entries in the admin, or restore ([restore-cms](./restore-cms.md)).

## Tests
```sh
pnpm --filter @llf/seed test
pnpm --filter @llf/seed typecheck
```

## Escalation
Art for seed or fixture questions.
