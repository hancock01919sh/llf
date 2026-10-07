# @llf/cms

Strapi 5 CMS for Long Live Food, imported with `git subtree` from `AdCouncil/ending-wasted-food-strapi` (commit `f753967`). Schema, roles, and hardening rules are in [TDD §5](../../docs/TDD.md#5-cms-strapi).

## Local development

Run from the repo root:

```sh
pnpm db:up                         # Postgres 16 in Docker (POSTGRES_PORT overrides 5432)
cp apps/cms/.env.example apps/cms/.env   # fill in secrets: openssl rand -base64 32
pnpm dev:cms                       # strapi develop on http://localhost:1337/admin
```

Postgres only, everywhere (Docker locally, Render Postgres, then RDS). There is no SQLite fallback.

## Build and run in Docker

```sh
docker build -f apps/cms/Dockerfile -t llf-cms .
```

The build context is the repo root because the image is built from the pnpm workspace. `ADMIN_PATH`, `STRAPI_ADMIN_BACKEND_URL`, and `STRAPI_TELEMETRY_DISABLED` are baked into the admin bundle at build time, so build once per environment. The admin bundle is written to `build/`, not `dist/`.

## Rules

- Schema changes are additive and backward compatible; relation changes are two-phase (TDD §5.2).
- Every schema change updates the matching Zod schema in `packages/contracts`.
- The Public role has no permissions. The site reads content with an API token at build time.
- Strapi AI and the Strapi Cloud plugin are disabled; they call services Ad Council IT hasn't approved.
