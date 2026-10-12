# Runbook: schema changes and migrations

**Status:** first draft for review (BD3244-18). The migration folder exists but holds no migrations yet. The two-phase rule is [PROPOSED] in [TDD §5.2](../TDD.md#52-proposed-v1-schema-proposed).

## Purpose
Change the Strapi content model without losing content or breaking the site. Schema changes ship **as code through a deploy**, never by editing a deployed admin.

## When to use it
Any change under `apps/cms/src/api/` or `apps/cms/src/components/`: a new content type, field, component, or relation.

## Who
Developers write it. Art reviews every schema PR (`packages/contracts` also needs a tech-lead review via CODEOWNERS).

## Rules
- **Additive and backward compatible.** Add fields and types. Don't change a field's type or a relation's type in place: Strapi can silently drop data.
- **Two-phase for anything non-additive** (type changes, relation changes, renames, removals):
  1. **Expand.** Add the new field or relation next to the old one. A migration script in `apps/cms/database/migrations` copies the data across. It must be **idempotent** and log what it does. The frontend reads the new field and falls back to the old one.
  2. **Contract.** After every environment is migrated and its content is verified, a later release removes the old field.
- Until real content is entered (target: end of October), non-additive changes are allowed destructively on **dev** only. After that, always two-phase.
- Every schema change updates the matching Zod schema in `packages/contracts` ([AGENTS.md](../../AGENTS.md)). Don't define shapes anywhere else.
- The Content-Type Builder is **off** in staging and prod (`NODE_ENV=production`). Use it only locally to generate files, then commit them.
- The Public role keeps **no permissions**.
- A schema PR merges and deploys to cms-dev **before** the frontend PR that needs it. PR previews cover the web app only.

## Prerequisites
- [run-locally](./run-locally.md) with the CMS working (`pnpm dev:cms`).
- A backup plan for deployed environments ([restore-cms](./restore-cms.md)).

## Steps
1. Branch from `dev` ([branching-and-prs](./branching-and-prs.md)).
2. Start the CMS: `pnpm dev:cms`. In the local admin, use the Content-Type Builder to make the **additive** change. Strapi writes files under `apps/cms/src/`.
3. Review the generated files in `git diff`. Remove anything unrelated.
4. Update `packages/contracts/src/cms.ts` and its test (`cms.test.ts`). If the web app reads the type, update `apps/web/lib/cms.ts` (its `populate` tree).
5. Update the fixtures so CI keeps building against fixtures (`apps/web/fixtures/cms/`) and the seed (`scripts/seed/fixtures/`). Keep the two in step.
6. If data must be moved (an expand step), write the migration script in `apps/cms/database/migrations/`. Make it idempotent. Test it on a copy of a seeded database, and run it twice to prove it.
7. Run the checks:
   ```sh
   pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
   CMS_FIXTURES=1 pnpm build && pnpm e2e
   ```
8. Prove the seed still works against the new schema:
   ```sh
   CMS_URL=http://localhost:1337 CMS_SEED_TOKEN=… pnpm seed
   ```
   The seed's verify step reads content back with the web app's `populate` tree and parses it with the `cms.*` schemas.
9. Open the PR into `dev`. In the description, explain any non-additive change, the migration, and which environments need it. Mark the PR template checkbox.
10. After merge, the dev CMS deploys the new schema (Render auto-deploy after BD3244-15). Check the admin. Promote through `staging` and `prod` with the usual PRs.

## Verification
- The site builds against the updated CMS (the build fails on invalid content).
- Existing entries still open and publish in the admin.
- The migration, run a second time, changes nothing.

## Rollback
Additive changes are harmless to leave in place: revert the code and leave the field unused. If a migration damaged data, restore from the backup taken before the deploy ([restore-cms](./restore-cms.md)). Don't edit the schema on a deployed environment to "fix" it.

## Escalation
Art. Ad Council content owners decide questions about relations (for example OPEN-14, whether a tip applies to many ingredients).
