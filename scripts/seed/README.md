# `@llf/seed`: synthetic fixture seed

Loads synthetic content into Strapi so a fresh environment (local, Render dev, a PR preview) has something to render and test against. See [TDD §5.5](../../docs/TDD.md#55-content-seeding-and-migration) and [§11.4](../../docs/TDD.md#114-local-development-and-the-china-team).

The content is **synthetic**. It is not client copy, so never seed it into staging or production.

## What it does

1. Loads `fixtures/*.json` and validates them with the `seed` schemas in `@llf/contracts`. Relations are referenced by natural key (an ingredient title, a category slug, a page path), and validation fails on any dangling reference.
2. Upserts each entry by its **natural key**: title for taxonomies, ingredients, tips and groups; slug for categories; path for pages. Re-running updates entries and never duplicates them. Entries are written in dependency order and published.
3. **Verifies** the result. It reads the published content back with the same `populate` tree the web app uses (`apps/web/lib/cms.ts`) and parses it with the site's `cms.*` schemas. If the seed passes, the site can render that content.

| Fixture | Content type(s) | Notes |
|---|---|---|
| `taxonomies.json` | tip type, behavior, motivator | Placeholder values: `TODO(BD3244-11)` |
| `ingredients.json` | ingredient | |
| `tips.json` | tip | Tip → ingredient is `manyToOne`; tip → taxonomies is `manyToOne` |
| `groups.json` | group | |
| `categories.json` | category | |
| `pages.json` | page + blocks | Includes `examples` and `pantry`, which exist only in the seed |

The seed is a superset of `apps/web/fixtures/cms/`. Keep the two in step when you change a content type.

## Usage

```sh
pnpm seed --dry-run                                         # validate fixtures only (no CMS_URL)
CMS_URL=http://localhost:1337 CMS_SEED_TOKEN=… pnpm seed --dry-run   # report what would change
CMS_URL=http://localhost:1337 CMS_SEED_TOKEN=… pnpm seed             # upsert, publish, verify
pnpm seed --fixtures path/to/dir                            # use another fixture directory
```

| Variable | Meaning |
|---|---|
| `CMS_URL` | Strapi base URL, e.g. `http://localhost:1337` |
| `CMS_SEED_TOKEN` | A **full-access** Strapi API token. Create it for the run and revoke it afterwards. Never commit it, and never put it in Jira, Slack or a PR |

The script loads the root `.env` if there is one. It's safer to pass the token inline for a single run.

## Getting a token (local)

Start the stack (`pnpm db:up && pnpm dev:cms`), then use the admin UI at <http://localhost:1337/admin> (**Settings → API Tokens → Create new API token**, type *Full access*, duration *Unlimited*).

You can also do it from the shell against a fresh database:

```sh
# First run only: create the admin user. It returns an admin JWT in data.token.
curl -s localhost:1337/admin/register-admin -H 'content-type: application/json' \
  -d '{"firstname":"Local","lastname":"Admin","email":"you@example.com","password":"…"}'

# Later runs: log in instead. Also returns data.token.
curl -s localhost:1337/admin/login -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"…"}'

# Create the seed token. It returns data.accessKey (shown once) and data.id.
curl -s localhost:1337/admin/api-tokens -H "authorization: Bearer $ADMIN_JWT" \
  -H 'content-type: application/json' \
  -d '{"name":"local-seed","description":"seed run","type":"full-access","lifespan":null}'
```

**Revoke the token afterwards.** Delete it in the admin UI, or call `curl -X DELETE localhost:1337/admin/api-tokens/$ID -H "authorization: Bearer $ADMIN_JWT"`.

## Notes and gotchas

- **Port 5432 already in use?** Set `POSTGRES_PORT=5433` in the root `.env`, then delete `apps/cms/.env` so `pnpm dev:cms` regenerates it with the new `DATABASE_PORT`.
- **Calling Strapi with curl:** square brackets in query strings (`filters[title][$eq]=…`) need `curl -g` or `%5B`/`%5D` encoding.
- **Media:** the seed doesn't upload images yet (OPEN-28). Image fields are left empty, and the site renders without them.
- **Shared taxonomy terms:** several tips point to the same taxonomy term (`manyToOne`, redeclared in P1). `node scripts/check-cms-relations.mjs` checks the cardinality of every relation against a running CMS.
- **Render dev:** seeding Render waits on BD3244-15, which provides the service and its admin URL. The steps are the same, run with that environment's `CMS_URL` and a short-lived token.

## Tests

```sh
pnpm --filter @llf/seed test       # loader, upsert order, idempotency, verify (fetch is mocked)
pnpm --filter @llf/seed typecheck
```
