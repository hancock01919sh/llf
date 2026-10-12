# Runbook: restore the CMS from a snapshot or export

**Status:** first draft for review (BD3244-18). The backup jobs don't exist yet. Render steps are pending BD3244-15. AWS steps are pending BD3244-6. `strapi transfer` and `export` behavior must still be proven (P7, [`PROOF_DOC.md`](../PROOF_DOC.md)).

## Purpose
Recover CMS content (entries and media) after data loss, a bad bulk edit, or a failed migration.

**Never restore with a raw database dump into a different platform.** It carries Render-specific media paths and Strapi internals ([TDD §5.5](../TDD.md#55-content-seeding-and-migration)). Same-platform database snapshots are fine.

## When to use it
- Content was deleted or damaged and the editors can't undo it in the admin.
- The database is lost or corrupt.
- A schema migration went wrong.

## Who
A tech lead with James Steele for AWS or Render access. The CMS super-admin after handoff (OPEN-11) approves restoring production.

## Backups available
| Env | Source | Notes |
|---|---|---|
| Render (dev, staging) | Render managed Postgres backups | Plus a nightly `strapi export` to the ddd backup location. TODO: confirm location (BD3244-15) |
| AWS (staging, prod) | RDS automated snapshots and point-in-time recovery | Plus a nightly encrypted `strapi export` to S3. Pending BD3244-6 |

The export archive includes assets. Its encryption key is held outside the repo (client vault).

## Prerequisites
- The environment name, and the time you want to restore to.
- The export file and its key, or snapshot access.
- Admin access to the target CMS from an allow-listed IP.
- Editors told to stop publishing during the restore.

## Steps

### 0. Stop new changes
Disable the environment's publish webhook (Settings → Webhooks). Tell editors to pause. Note the time.

### Option A: restore from a `strapi export` archive
Use this when the database is intact but content is damaged, or when you only need content and media back. Run it where Strapi is installed, against the target's database.

1. Take a fresh export first, so you can undo this restore:
   ```sh
   pnpm --filter @llf/cms strapi export -f before-restore
   ```
2. Import the archive. `--force` overwrites existing data, so confirm the target environment twice:
   ```sh
   pnpm --filter @llf/cms strapi import -f <archive>.tar.gz.enc --force
   ```
   Strapi asks for the encryption key. Enter it at the prompt. Don't put it in your shell history or on the command line.
3. Restart Strapi.

> TODO(P7, BD3244-3): the exact flags and the process on Render (shell access) and on AWS (ECS Exec or SSM) are pending the spike. Run `pnpm --filter @llf/cms strapi export --help` to see the flags in the installed version.

### Option B: restore the database from a snapshot
Use this when the database itself is lost. Content created after the snapshot is lost.

1. **Render:** in the Render dashboard, open `llf-db-<env>` → **Recovery**, and restore to a point in time or a backup. This creates a new instance or replaces the existing one. Pending BD3244-15.
2. **AWS:** restore the RDS snapshot or point in time to a **new** instance, then point Strapi at it through the stack config (`DATABASE_*` in Secrets Manager). Pending BD3244-6.
3. Restore uploaded media: the Render disk or the S3 media bucket must match the database. If media is missing, use Option A's archive for assets.
4. Restart Strapi.

### 3. Check, then reopen
1. Log in to the admin and open a recent entry and a media item.
2. Re-enable the publish webhook and publish a no-op change, or trigger a build ([publish-fails](./publish-fails.md)).
3. Tell editors they can start again, and which time window was lost.

## Verification
- Entry counts for ingredients, tips, categories, and pages match what you expected.
- Every media URL in the content resolves. Run the site build: it validates all content and fails on a broken entry.
- The live site rebuilds and looks right.

## Rollback
Option A: import the `before-restore` export. Option B: switch Strapi back to the previous database instance, which you kept until the restore was verified.

## Escalation
Tech lead → James Steele → Danish. If production content was lost, tell Cat on the same day.
