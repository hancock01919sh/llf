# Runbook: roll back a release

**Status:** first draft for review (BD3244-18). The AWS steps are pending INFRA-AWS (BD3244-6, OPEN-3). Nothing is deployed on AWS yet.

## Purpose
Put the site back on a previous good version. Pages and the tool catalog live in the same release, so they roll back together.

## When to use it
- A release that passed the pipeline is broken (wrong content, a broken page, bad tool behavior).
- A cutover rollback on launch day ([`LAUNCH_CHECKLIST.md`](../LAUNCH_CHECKLIST.md) §2).

## Who
Decision owner: Art (tech lead), with Cat (Ad Council) informed for production. Executor: a tech lead or James Steele.

## Prerequisites
- AWS access that can update the CloudFront KeyValueStore (SSO project-admin set, OPEN-3).
- The recent build IDs: the folders under `s3://<site-bucket>/releases/`, and the release tags (`vYYYY.MM.DD-n`) in [`RELEASE_LOG.md`](../RELEASE_LOG.md).
- Old releases expire after 30 days and the last 10 are kept ([TDD §5.3](../TDD.md#53-publishing-flow-proposed)). You can only roll back to one that still exists.

## Option A: switch the release pointer (AWS staging and production)
The pointer is the key `current_release` in the environment's CloudFront KeyValueStore. The viewer-request function (`infra/cloudfront-functions/src/site-viewer-request.js`) rewrites every site request to `/releases/<current>/…`.

> TODO(BD3244-6): the bucket, KeyValueStore ARN, and any wrapper workflow aren't defined yet. Prefer a manual `deploy-site` mode that takes a build ID over raw CLI calls, so the change is logged in GitHub.

1. Find the last good build ID in the `deploy-site` run history or the release tag. Confirm its folder exists in the site bucket.
2. Read the current value and the store's `ETag`, so you can undo the change:
   ```sh
   aws cloudfront-keyvaluestore describe-key-value-store --kvs-arn <KVS_ARN>
   aws cloudfront-keyvaluestore get-key --kvs-arn <KVS_ARN> --key current_release
   ```
3. Write the previous build ID:
   ```sh
   aws cloudfront-keyvaluestore put-key --kvs-arn <KVS_ARN> --key current_release \
     --value <PREVIOUS_BUILD_ID> --if-match <ETAG>
   ```
4. Wait up to a minute for the change to propagate.
5. Pause publishing so the next content publish doesn't move the pointer forward again. Disable the environment's CMS webhook (Settings → Webhooks) or the `deploy-site` workflow. Re-enable it after the cause is fixed.

## Option B: DNS back to the holding page (platform failure)
Use this only if the platform itself is broken (CloudFront, WAF, certificate). It's a launch-day option.

> TODO(OPEN-20): the DNS owner, the zone, and the holding page location aren't known yet. The TTL is lowered a week before cutover ([`LAUNCH_CHECKLIST.md`](../LAUNCH_CHECKLIST.md)).

## Option C: Phase A (Render dev and staging)
1. Open `llf-web-<env>` → **Events**. Find the last good deploy and choose **Rollback**.
2. Do the same for `llf-tips-<env>` if the tool changed.
3. Turn off auto-deploy on the service until the fix is merged, so the next push doesn't redeploy the bad commit.

> Pending BD3244-15: Render services don't exist yet.

## Verification
1. Open the site in a private window and confirm the previous content or behavior is back.
2. Call `/api/find-tips/status` and confirm `catalogVersion` matches the rolled-back build ID.
3. Run the smoke test from [`LAUNCH_CHECKLIST.md`](../LAUNCH_CHECKLIST.md) §2 step 4: every route, the tool on each input type, 404, and redirects.

## After a rollback
1. Open a Jira ticket and a fix PR. For production, use a `hotfix/*` branch from `prod`, and merge it back into `staging` and `dev` the same day ([branching-and-prs](./branching-and-prs.md)).
2. Log the incident in [`RELEASE_LOG.md`](../RELEASE_LOG.md).
3. Re-enable the webhook or workflow only after the fix is live.

## Undo the rollback
Write the original value back with `put-key` (step 3).

## Escalation
Art → James Steele (AWS) → Cat and Danish (production impact). For a security concern, also tell Ad Council IT.
