# Runbook: Strapi patch upgrade

**Status:** first draft for review (BD3244-18). The scripts exist in `apps/cms/package.json`. Render and AWS deploy steps are pending BD3244-15 and BD3244-6.

## Purpose
Move Strapi to the latest patch (or minor) release safely. The security posture relies on monthly patch upgrades ([TDD §10](../TDD.md#10-security-and-privacy)). Strapi and Next.js minor versions are upgraded every quarter ([TDD §9.6](../TDD.md#96-operations-and-handoff-input-to-the-om-manual)).

## When to use it
- Monthly, or sooner for a security advisory.
- A Strapi bug fix you need.

## Who
A tech lead. Review: another tech lead. Production upgrades follow the promotion PRs.

## Prerequisites
- Node 22 and pnpm (`corepack enable`), Docker running.
- Read the Strapi release notes for every version between the current one and the target. Look for breaking changes and migrations.
- Strapi versions are pinned exactly in `apps/cms/package.json` (currently `5.45.0`). Keep `@strapi/strapi` and `@strapi/plugin-users-permissions` on the **same** version.

## Steps
1. Start from a fresh branch off `dev`: `chore/strapi-<version>` ([branching-and-prs](./branching-and-prs.md)).
2. Take a local backup of your dev data: `pnpm --filter @llf/cms strapi export -f pre-upgrade` (optional locally, **required** before upgrading a deployed environment: see [restore-cms](./restore-cms.md)).
3. Do a dry run. It lists what the codemods would change and changes nothing:
   ```sh
   pnpm --filter @llf/cms upgrade:dry
   ```
4. Run the upgrade. For a patch only, pass the target explicitly instead of `latest`: `npx @strapi/upgrade patch`. Use `minor` for a minor release.
   ```sh
   pnpm --filter @llf/cms upgrade
   ```
5. Check the diff. Confirm both Strapi packages have the same pinned version, and that the lockfile changed as expected. Keep pins exact (no `^`).
6. Install and rebuild:
   ```sh
   pnpm install
   pnpm build:cms
   docker build -f apps/cms/Dockerfile -t llf-cms .
   ```
7. Run the stack and seed it to prove content still works:
   ```sh
   pnpm dev:cms
   CMS_URL=http://localhost:1337 CMS_SEED_TOKEN=… pnpm seed
   ```
   Check the admin loads, a page edits and publishes, and the Public role still has **no** permissions.
8. Run the checks that CI runs:
   ```sh
   pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
   CMS_FIXTURES=1 pnpm build && pnpm e2e
   ```
9. Open the PR to `dev`. Note the old and new versions, the release notes link, and anything unusual.
10. After merge, check cms-dev (Render deploy log; the admin; a publish end to end). Promote to `staging`, check again, then promote to `prod` with the usual review.

## Verification
- Admin login works, and so do publishing and a site build ([publish-fails](./publish-fails.md) if it doesn't).
- Content-Type Builder is still off in staging and prod (`NODE_ENV=production`).
- `/_health` answers. API tokens still work.

## Rollback
Revert the PR through the same promotion path, and redeploy the previous image. Strapi upgrades can run database migrations on start. If the new version already migrated the database, restore from the pre-upgrade backup ([restore-cms](./restore-cms.md)).

## Escalation
Tech lead → Art for the schema or plugin concerns → James Steele for a deploy problem.
