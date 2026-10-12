# Runbook: move content between environments (`strapi transfer`)

**Status:** first draft for review (BD3244-18, BD3244-3). `strapi transfer` between environments is not yet proven (P7, [`PROOF_DOC.md`](../PROOF_DOC.md)). Every remote step is pending BD3244-15 and BD3244-6.

## Purpose
Copy content and media from one CMS to another. Content never moves between environments automatically ([TDD §4.3](../TDD.md#43-environments-and-network)).

## When to use it
| Move | When |
|---|---|
| Render staging → AWS staging | Nov 25 (Phase B cutover) |
| AWS staging → AWS prod | Jan 4, after the Dec 23 content freeze |
| Rehearsals on the seed set | Before both of the above (P7, P11) |

After Jan 4, **prod is the source of truth**. Content changes during Jan 4–7 are made in prod only.

**Never transfer synthetic seed content into staging or production**, and never use a raw database dump.

## Who
A tech lead with James Steele. Ad Council approves the production move.

## Prerequisites
- Source and target are on the **same Strapi version** and the same schema (deploy the schema first).
- A **transfer token** on each end that needs one, from Strapi admin **Settings → Transfer Tokens**, with the shortest lifetime. Create it for the run and delete it afterwards. Don't paste it anywhere. `TRANSFER_TOKEN_SALT` must be set on the instance (a secret, see [rotate-secrets](./rotate-secrets.md)).
- A fresh backup of the target ([restore-cms](./restore-cms.md)).
- Your IP on the allow-list of both CMS instances, if the transfer endpoint sits behind it ([cms-ip-allow-list](./cms-ip-allow-list.md)). TODO(P7): confirm whether the transfer path can pass the allow-list.
- Publishing paused on the target.

## Steps

### Option A: direct transfer
Run from a machine that has the repo and can reach the source or target. Check the exact flags with `pnpm --filter @llf/cms strapi transfer --help`.
```sh
pnpm --filter @llf/cms strapi transfer --to https://<target-cms>/admin --to-token <TOKEN>
```
Pull instead of push with `--from https://<source-cms>/admin --from-token <TOKEN>`. Strapi asks for confirmation, because the target's data is **replaced**. Read it before you answer.

### Option B: export and import (fallback)
Use it if `transfer` fails (volume, timeouts, a provider mismatch).

1. On the source: `pnpm --filter @llf/cms strapi export -f llf-<env>-<date>` (encrypted, includes assets). Keep the key in the client's vault.
2. Move the file to a machine that can reach the target.
3. On the target: `pnpm --filter @llf/cms strapi import -f llf-<env>-<date>.tar.gz.enc --force`.
4. If media doesn't come across: copy the disk uploads to the S3 media bucket, rewrite the media URLs, then run the media check below.

## Verification
1. Entry counts match between source and target.
2. **Every media URL in the content resolves.** The site build validates all content with Zod and fails on bad entries.
3. Build the site against the target and compare key pages with the source.
4. Delete the transfer tokens. Re-enable publishing.

## Rollback
Restore the target from the backup you took ([restore-cms](./restore-cms.md)). The source is unchanged by a transfer.

## Escalation
Tech lead → James Steele → Danish. For the production move, tell Cat before and after.
