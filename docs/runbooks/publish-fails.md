# Runbook: a CMS publish doesn't go live

**Status:** first draft for review (BD3244-18). Phase A (Render) steps depend on BD3244-15. Phase B (AWS) steps depend on INFRA-AWS (BD3244-6, OPEN-3).

## Purpose
An editor published, unpublished, or deleted an entry, but the change isn't on the site after the expected time. This runbook finds where the chain broke and gets the content live.

## When to use it
- A publish isn't visible after **10 minutes**. The target on AWS is 3–6 minutes ([TDD §5.3](../TDD.md#53-publishing-flow-proposed)).
- You got a `deploy-site` failure alert (Phase B) or a Render deploy-failure email (Phase A).

## Who
Tech lead on call (ddd). Editors report the problem. They don't fix it.

## Prerequisites
- Read access to GitHub Actions runs (Phase B) or the Render workspace (Phase A).
- Admin access to the CMS from an allow-listed IP.
- Never paste a webhook secret or deploy-hook URL into Jira, Slack, or a PR.

## How publishing works
- **Phase A (Render):** a Strapi webhook calls the Render **deploy hook** for the environment's `llf-web-<env>` service. Render rebuilds. A failed build leaves the previous deploy live.
- **Phase B (AWS, D36):** no rebuild. Pages refresh through ISR within about a minute, and Strapi's webhook calls `POST /api/hooks/publish` on the Next.js service, which invalidates CloudFront. If a page's content fails Zod validation, that page keeps serving its last good version and a CloudWatch alarm fires: check the web service's logs for the failing entry, fix it in the CMS, and publish again.

## Steps

### 1. Check the content is published
1. Open the entry in the Strapi admin. Confirm it says **Published**, not Modified or Draft. Drafts never trigger a build.
2. If it's a draft, publish it. Wait 10 minutes. Stop here if it goes live.

### 2. Phase A: check Render
1. In the Render workspace, open `llf-web-<env>` → **Events** and **Logs**.
2. If there's no build for the publish time, the webhook didn't fire. Go to [step 4](#4-check-the-webhook).
3. If the build failed, read the log. The usual cause is **invalid content**: the build validates everything with Zod and fails on a bad entry. The log names the field. Fix the entry in the CMS and publish again.
4. If the build failed for a code reason, fix it through a normal PR to the environment's branch ([branching-and-prs](./branching-and-prs.md)). Render redeploys on push.
5. To retry without changing content, use **Manual Deploy → Deploy latest commit** on `llf-web-<env>`.

### 3. Phase B: check GitHub Actions
> Pending BD3244-6. `deploy-site.yml` doesn't exist yet. The steps below are the intended procedure.

1. Open **Actions → deploy-site** and find the run for the publish time.
2. No run: the relay or the dispatch failed. Go to [step 4](#4-check-the-webhook).
3. Run failed: read the failing step. Invalid content fails the validate step. Fix the entry and publish again.
4. Run is waiting behind another: that's expected. Concurrency allows one running and one waiting build per environment, and every build reads the **latest** content. Wait for it.
5. To retry, use **Re-run failed jobs**, or **Run workflow** (`workflow_dispatch`) with the environment name.

### 4. Check the webhook
1. In the Strapi admin, open **Settings → Webhooks** and the environment's webhook. Check it's **enabled** and lists the publish, unpublish, and delete events. The exact event list comes from the spike in [`PROOF_DOC.md`](../PROOF_DOC.md).
2. Use **Trigger** and look at the response.
3. Phase A: a 404 or 401 from Render means the deploy-hook URL was regenerated. Update the webhook with the new URL from the Render env group. See [rotate-secrets](./rotate-secrets.md).
4. Phase B: a 401 or 403 from the relay means the shared-secret header doesn't match. Compare the webhook secret in Secrets Manager with the webhook config (names only, never values). If the relay accepts the call but no run starts, check the relay's CloudWatch logs for a GitHub App token or install error.

### 5. Last resort: build by hand
- Phase A: Manual Deploy on Render (step 2.5).
- Phase B: run `deploy-site` with **Run workflow**. Don't upload to S3 or edit the pointer by hand unless the tech lead agrees. Manual changes skip validation.

## Verification
1. Open the live page in a private window and confirm the change.
2. On AWS, check that `catalogVersion` from `/api/find-tips/status` matches the new build ID.
3. Post the result in the incident thread.

## Rollback
The previous release is still live, so there's usually nothing to roll back. If a bad build went live, follow [roll-back-release](./roll-back-release.md) (Phase B), or unpublish the offending entry (both phases).

## Escalation
1. Tech lead on call. 2. James Steele for AWS, Render, or Actions problems. 3. Danish (PM) if a UAT or launch date is at risk.
