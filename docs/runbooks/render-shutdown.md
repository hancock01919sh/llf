# Runbook: shut down Render

**Status:** first draft for review (BD3244-18). Pending BD3244-15 (Render services) and the AWS go-live (BD3244-6). Render dev may be kept or retired (OPEN-24).

## Purpose
Close out Phase A after launch without leaving content, services, or secrets behind ([TDD §12.2](../TDD.md#122-hosting-phases-and-the-render--aws-migration-tl-decision-for-the-phases-dates-proposed)). **Production never ran on Render.**

## When to use it
After hypercare ends (about Jan 22, 2027), once AWS prod is stable. Render staging is deleted earlier, after Dec 8, once AWS staging has been the source of truth.

## Who
James Steele and a tech lead. Danish confirms the date.

## Prerequisites
- Hypercare is closed and AWS prod is healthy ([`LAUNCH_CHECKLIST.md`](../LAUNCH_CHECKLIST.md) §3).
- OPEN-24 is decided: keep dev (and who pays), or retire it.
- A recent export of anything still only on Render.

## Steps
1. Take a final export of each Render CMS that still holds content ([restore-cms](./restore-cms.md), Option A). Store it in the ddd backup location, with its key in the client's vault.
2. Confirm AWS staging and prod have the content you need ([transfer-content](./transfer-content.md)).
3. In Render, delete the services for each environment you're retiring: `llf-web-<env>`, `llf-tips-<env>`, `llf-cms-<env>`, `llf-db-<env>`, `llf-kv-<env>`, and the disk.
4. Rotate or revoke every secret that lived on Render: the env groups, deploy hooks, API tokens, and basic-auth credentials ([rotate-secrets](./rotate-secrets.md)). Revoke the Render API key and delete the GitHub `dev` environment's `RENDER_API_KEY`, then disable the **Deploy dev** workflow.
5. **Revoke ddd's Anthropic key** and Gemini key, once the client key is live and nobody needs them for eval.
6. Remove the Render webhook URLs from the Strapi webhook settings (Render webhooks only).
7. Update [`CLIENT_AUDIT.md`](../CLIENT_AUDIT.md) and the TDD as-built.

## Verification
- The Render dashboard lists no `llf` services for retired environments.
- The provider consoles show the retired keys as revoked.
- AWS environments still build and publish ([publish-fails](./publish-fails.md)).

## Rollback
Deleted services can't be restored. Rebuild from the Blueprint and import the export. That's why the export comes first.

## Escalation
James Steele → Danish.
