# Runbook: add an IP to the CMS admin allow-list

**Status:** first draft for review (BD3244-18). The allow-list isn't built yet. Phase A middleware: pending BD3244-15 and the spoofing spike in [`PROOF_DOC.md`](../PROOF_DOC.md). Phase B WAF IP set: pending BD3244-6. Which IPs go on the list is OPEN-17 (due Oct 30).

## Purpose
Let a person reach the Strapi admin from a new network, or remove someone who no longer needs it. The admin is **never public** ([AGENTS.md](../../AGENTS.md)).

## When to use it
- An editor, developer, or China-team member needs admin access from a new IP.
- Someone leaves, or an IP is no longer theirs.
- A quarterly review of the list.

## Who
A tech lead makes the change. Ad Council IT approves editor IPs. Don't add an IP because someone asked in chat: get the request in Jira with the person's name, IP, environment, and an end date.

## Prerequisites
- A Jira ticket with the details above.
- The person's **public** IPv4 or IPv6 address. Ask them to check it from the network they'll use. Prefer a static IP or a VPN range over a home address that changes. Never add `0.0.0.0/0` or a very wide range.
- Access to the allow-list setting for that environment.

## What the allow-list covers
Everything on the CMS **except** `/api/*` (token required) and `/_health`.

## Steps

### Phase A: Render (dev and staging)
The allow-list is the `ADMIN_IP_ALLOWLIST` environment variable, read by a small Strapi middleware ([TDD §5.4](../TDD.md#54-hosting-and-operations)).

> Pending BD3244-15: the middleware isn't in `apps/cms/config/middlewares.js` yet, so there's nothing enforcing the list today. The variable's exact format (comma-separated CIDRs is the expected form) is set when it's built. TODO(OPEN-17): the starting list of IPs.

1. In Render, open the `llf-<env>` environment group.
2. Add the new address or range to `ADMIN_IP_ALLOWLIST`. Keep a note of the ticket next to the change.
3. Save. Render restarts `llf-cms-<env>`.

### Phase B: AWS (staging and production)
The CMS domain is behind CloudFront with a WAF **IP set** ([TDD §4.3](../TDD.md#43-environments-and-network)). The list belongs in the CDK code, so the change is reviewed.

> Pending BD3244-6: stack and construct names aren't defined yet.

1. Edit the allow-list in the `Edge` stack configuration in `infra/`. Add the address as `/32` (IPv4) or `/128` (IPv6), with a comment containing the ticket number.
2. Open a PR to `dev`. For staging and production, the change goes through the promotion PRs and the required reviewers ([branching-and-prs](./branching-and-prs.md)).
3. After merge, `deploy-infra` applies it.
4. For an urgent change, a tech lead and James Steele can edit the IP set in the WAF console, then **must** put the same change into the code the same day so it isn't lost on the next deploy.

## Verification
1. Ask the person to open the admin URL. They should see the login page.
2. From a network that's **not** on the list, the admin must be blocked (Phase A: the middleware's block response. Phase B: a WAF 403).
3. Check `/api/*` still needs a token, and that `/_health` answers.

## Removing an IP
Do the same steps in reverse. Remove it, then verify the person is blocked.

## Rollback
Remove the address you added. If you locked everyone out (a bad edit), use the Render dashboard or the AWS console to restore the previous value. Locally, the admin isn't restricted.

## Escalation
Tech lead → James Steele → Ad Council IT. Report a suspected admin compromise right away, and rotate credentials ([rotate-secrets](./rotate-secrets.md)).
