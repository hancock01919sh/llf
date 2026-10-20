# Runbook: add an IP to the CMS admin allow-list

**Status:** Phase A middleware **built** (BD3244-15, `apps/cms/src/middlewares/admin-ip-allowlist.js`); the header-spoofing spike on Render is still to run ([`PROOF_DOC.md`](../PROOF_DOC.md)). Phase B WAF IP set: pending BD3244-6. Which IPs go on the list is OPEN-17 (due Oct 30).

## Purpose
Let a person reach the Strapi admin from a new network, or remove someone who no longer needs it. The admin is **never public** on staging or production ([AGENTS.md](../../AGENTS.md)). On **dev**, during the build, it's open to every IP (`ADMIN_IP_OPEN=true`, TDD D31), and the list only guards the first-admin sign-up.

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
Everything on the CMS **except** `/api/*` (token required), `/uploads/*` (the media the site's pages load in Phase A) and `/_health`. Blocked requests get `403 Forbidden`.

## Steps

### Phase A: Render (dev and staging)
The allow-list is the `ADMIN_IP_ALLOWLIST` environment variable on the `llf-cms-<env>` service, read by a Strapi middleware that runs before everything else ([TDD §5.4](../TDD.md#54-hosting-and-operations)).

- **Format:** IPs and CIDR ranges separated by commas or spaces, e.g. `203.0.113.7, 198.51.100.0/24, 2001:db8::/48`. An invalid entry or a `/0` range stops the CMS from starting, so a typo never opens the admin.
- **Empty list = admin blocked for everyone** (fail closed) whenever `NODE_ENV=production`, which is how Render runs it. `/api/*`, `/uploads/*` and `/_health` stay up.
- **Client IP:** the second `X-Forwarded-For` entry from the right (`ADMIN_IP_HEADER=x-forwarded-for`, `ADMIN_IP_TRUSTED_HOPS=2`). Render appends the visitor's address and then Cloudflare's edge address; entries to their left come from the client and are ignored (verified on cms-dev, PROOF_DOC P4). Cloudflare rejects requests that send their own `CF-Connecting-IP`.
- **Dev is open (D31):** `ADMIN_IP_OPEN=true` with `DEPLOY_ENV=dev` lets every IP reach the admin except Strapi's first-admin sign-up (`/admin/register-admin`), which still needs a listed IP. The CMS won't start with `ADMIN_IP_OPEN` on any other `DEPLOY_ENV`. To lock dev again, delete `ADMIN_IP_OPEN` on `llf-cms-dev` and redeploy.
- **Locally** there's no list and no enforcement, so the admin is open on `localhost`. Set `ADMIN_IP_ALLOWLIST` in `apps/cms/.env` (and `ADMIN_IP_HEADER=socket`) to try it.

TODO(OPEN-17): the starting list of IPs.

1. In Render, open `llf-cms-<env>` → **Environment**.
2. Add the new address or range to `ADMIN_IP_ALLOWLIST`. Keep a note of the ticket next to the change.
3. Save. Render restarts `llf-cms-<env>`. A bad value fails the deploy and the previous one stays live; fix the value and save again.

### Phase B: AWS (staging and production)
The CMS domain is behind CloudFront with a WAF **IP set** ([TDD §4.3](../TDD.md#43-environments-and-network)). The list belongs in the CDK code, so the change is reviewed.

> Pending BD3244-6: stack and construct names aren't defined yet.

1. Edit the allow-list in the `Edge` stack configuration in `infra/`. Add the address as `/32` (IPv4) or `/128` (IPv6), with a comment containing the ticket number.
2. Open a PR to `dev`. For staging and production, the change goes through the promotion PRs and the required reviewers ([branching-and-prs](./branching-and-prs.md)).
3. After merge, `deploy-infra` applies it.
4. For an urgent change, a tech lead and James Steele can edit the IP set in the WAF console, then **must** put the same change into the code the same day so it isn't lost on the next deploy.

## Verification
1. Ask the person to open the admin URL. They should see the login page.
2. From a network that's **not** on the list, the admin must be blocked (Phase A: `403 Forbidden` from the middleware. Phase B: a WAF 403). Also try a forged header from that network: `curl -sI -H 'X-Forwarded-For: <an allowed IP>' https://<cms-url>/admin` must still return 403.
   On dev, where the admin is open (D31), only the first-admin sign-up is blocked. The `Deploy dev` workflow checks that `POST /admin/register-admin` returns 403 from GitHub's runners after every deploy.
3. Check `/api/*` still needs a token (401 or 403 without one), and that `/_health` returns 204.

## Removing an IP
Do the same steps in reverse. Remove it, then verify the person is blocked.

## Rollback
Remove the address you added. If you locked everyone out (a bad edit), use the Render dashboard or the AWS console to restore the previous value. Locally, the admin isn't restricted.

## Escalation
Tech lead → James Steele → Ad Council IT. Report a suspected admin compromise right away, and rotate credentials ([rotate-secrets](./rotate-secrets.md)).
