# Runbook: Render dev environment

**Status:** in use (BD3244-15). The Blueprint, deploy workflow and smoke checks are in the repo; the one-time setup below is done by a ddd admin.

## Purpose
Run the shared **dev** environment on Render (Phase A, ddd's account) and get the live links: `llf-web-dev` for the site and `llf-cms-dev` for the CMS. Source: [TDD §9.1, §9.3](../TDD.md#91-accounts-access-and-regions), [`render.yaml`](../../render.yaml). **Production never runs on Render.**

## When to use it
- First-time setup of dev, or rebuilding it.
- A deploy failed, or you need to deploy by hand.
- Switching the web build from fixture content to the dev CMS.

## Who
A ddd admin (Art or a tech lead) for setup and secrets. Everyone else just merges to `dev`.

## How deploys work
1. A PR merges into `dev`.
2. **CI** runs on the push.
3. If CI passes, **Deploy dev** (`.github/workflows/deploy-dev.yml`) pushes that exact commit to the **deploy mirror**, then deploys it to `llf-cms-dev`, `llf-tips-dev`, `llf-gemini-relay-dev` and `llf-web-dev` in that order, waits until each is live, and smoke-tests it:
   - CMS: `/_health` → 204, `/admin` → 200 (open on dev, TDD D31) or 403, `POST /admin/register-admin` → 403 (the runner isn't allow-listed), `/api/pages` without a token → 401/403.
   - Relay: `/healthz` → 200, `POST /v1beta/models/gemini-3.8-flash:generateContent` without a token → 401.
   - Web: `/healthz` → 200, `/` → 401 (basic auth).
4. The run summary lists each service's URL. The `dev` GitHub environment links to the web URL.

Render's own auto-deploy is **off** in the Blueprint, so a red build never reaches dev. A failed Render build leaves the previous deploy live.

### The deploy mirror (D30)
Render's GitHub link can't fetch `dotdotdashdev/3244_tbw_ad_council` ("repository URL is invalid or unfetchable"), so the services build from **`dotdotdash-OMC/3244_tbw_ad_council`**, a private mirror in ddd's EMU org (the same setup as other OMC projects). Rules:
- **Never push to the mirror by hand or open PRs there.** `dotdotdashdev` stays the only repo people work in (the China team can't join an EMU org). Deploy dev pushes the tested tree to the mirror's `dev` **without `.github/workflows`**, as a new commit whose message is `Deploy dotdotdashdev/3244_tbw_ad_council@<source sha>`, and deploys that commit. (GitHub refuses workflow-file changes from the deploy key, and Render doesn't need them.) The run summary maps the mirror commit to the source commit.
- The push uses a **write deploy key** on the mirror. Its private half is the `RENDER_MIRROR_DEPLOY_KEY` secret in the GitHub `dev` environment; the mirror's name is the `RENDER_MIRROR_REPO` variable.
- Retire the mirror when the repo moves to Ad Council's org (OPEN-11) or Render can fetch the canonical repo: point each service's repo back, then delete the key and the mirror.

## Prerequisites
- An admin seat in ddd's Render workspace.
- Admin on the GitHub repo (to set environment secrets).
- The values for the `sync: false` secrets (below). Never paste them into Jira, Slack, a PR, or a doc.

## Current setup (Oct 19)
Done by Art. Render project **3244 Ad Council LLF** (environment `dev`), ddd workspace, region Oregon:
| Resource | ID | URL |
|---|---|---|
| `llf-web-dev` | `srv-dbbas5c9v7es73ei2fp0` | https://llf-web-dev.onrender.com (the review link) |
| `llf-cms-dev` | `srv-dbbas4tg1s2s7388cdrg` | https://llf-cms-dev.onrender.com |
| `llf-tips-dev` | `srv-dbbas46q1p3s73bto570` | private: `llf-tips-dev:10000` |
| `llf-gemini-relay-dev` | not created yet (BD3244-109) | public, token-only: https://llf-gemini-relay-dev.onrender.com |
| `llf-db-dev` | `dpg-dbbard3bc2fs73agog2g-a` | internal only |
| `llf-dev-tool` | `evg-dbbardbrjlhs73diteb0` | env group, linked to tips |

The services were created through the Render API from the values in `render.yaml` (the API can't apply a Blueprint), so they aren't Blueprint-managed yet. **Keep `render.yaml` and the services in step by hand** until someone links the Blueprint in the dashboard. The `BASIC_AUTH` login is shared by Art directly, never in a doc or ticket.

## Steps: first-time setup
1. Create the deploy mirror (above): a private repo in `dotdotdash-OMC`, push `dev` to it, and add a write deploy key.
2. In Render: **New → Blueprint**, connect the mirror, branch `dev`. Render reads `render.yaml`. (Or create the services with the API, as on Oct 19.)
3. Fill the prompted secrets:
   | Key | Service | Value |
   |---|---|---|
   | `ADMIN_IP_ALLOWLIST` | `llf-cms-dev` | Comma-separated IPs/CIDRs ([cms-ip-allow-list](./cms-ip-allow-list.md), OPEN-17). On dev it only guards the first-admin sign-up while `ADMIN_IP_OPEN=true` (`render.yaml`, D31); empty blocks the sign-up for everyone |
   | `GEMINI_API_KEY` | `llf-tips-dev` | ddd's Gemini dev key (TDD D25). Leave empty to run the tool with no live model |
   | `BASIC_AUTH` | `llf-web-dev` | `user:password` for the whole dev site |
   | `GEMINI_API_KEY` | `llf-gemini-relay-dev` | The same ddd Gemini dev key as `llf-tips-dev` (TDD D38) |
   | `RELAY_TOKENS` | `llf-gemini-relay-dev` | One token per developer, comma-separated, each from `openssl rand -hex 24` (see [Gemini relay tokens](#gemini-relay-tokens-tdd-d38)) |

   The Strapi secrets (`APP_KEYS`, `ADMIN_JWT_SECRET`, …) are generated by Render.
4. Apply. Render creates `llf-db-dev`, the four services and the `llf-dev-tool` env group, and runs a first deploy from `dev`.
5. Create a Render **API key** (Account settings → API keys). It's account-wide, so treat it as an admin credential.
6. In GitHub: **Settings → Environments → New environment `dev`**.
   - Secrets `RENDER_API_KEY` = the key from step 5, and `RENDER_MIRROR_DEPLOY_KEY` = the mirror deploy key's private half.
   - Variables `RENDER_MIRROR_REPO` (`owner/name` of the mirror) and `RENDER_SERVICE_ID_CMS_DEV`, `RENDER_SERVICE_ID_TIPS_DEV`, `RENDER_SERVICE_ID_RELAY_DEV`, `RENDER_SERVICE_ID_WEB_DEV` = each service's `srv-…` ID (in its Render URL and Settings page).
   - Deployment branches: **Selected branches → `dev`** only.
7. Run **Actions → Deploy dev → Run workflow** on `dev` and check the summary.
8. Open the CMS URL from an allow-listed IP, create the first admin (`/admin`), then follow [create-cms-users](./create-cms-users.md).
9. Upload one image in the Media Library to check the uploads disk is writable. If it fails with a permission error, raise it in BD3244-15 (the image runs as the `node` user).

## Gemini relay tokens (TDD D38)
`llf-gemini-relay-dev` lets developers in mainland China, where Google's API is blocked, call Gemini from their local tool ([run-locally](./run-locally.md#from-mainland-china-dev-only-tdd-d38)). It's dev only and never copied to staging or prod.
1. **Issue:** `openssl rand -hex 24`, append the token to `RELAY_TOKENS` on `llf-gemini-relay-dev` → Environment (comma-separated), save. Render restarts the service. Keep a note of whose token is in which position: logs show only the position (`caller`).
2. Send the token to that developer through a **secure share**, never Jira, Slack, a PR, or chat.
3. **Revoke:** remove the token from `RELAY_TOKENS` and save. Other tokens keep working.
4. **Limits:** `RELAY_MODELS` (allow-list) and `RELAY_DAILY_CALLS` (shared, resets at 00:00 UTC) are in `render.yaml`. The Gemini key's own Google spend cap still applies.
5. If the relay is abused or a token leaks widely, suspend the service in Render and rotate the Gemini key ([rotate-secrets](./rotate-secrets.md)).

## Steps: point the web build at cms-dev
Until cms-dev has content, `llf-web-dev` builds from fixtures (`CMS_FIXTURES=1`).
1. Seed cms-dev: create a short-lived full-access token in its admin (any IP on dev while D31 applies), then run `CMS_URL=<cms-dev URL> CMS_SEED_TOKEN=<token> pnpm seed`. The seed only calls `/api/*`, so it works from any machine. Revoke the token afterwards ([seeding](./seeding.md)).
2. Create a **read-only** API token in cms-dev.
3. On `llf-web-dev` → Environment: delete `CMS_FIXTURES`, add `CMS_URL=<cms-dev URL>` and `CMS_TOKEN=<read-only token>`.
4. Run **Deploy dev** by hand. The site now shows cms-dev content.

## Steps: deploy by hand
**Actions → Deploy dev → Run workflow** (branch `dev`). It deploys the head of `dev`.

## Verification
- The Deploy dev run is green and its summary shows `live` for each service.
- The web URL asks for basic auth, then shows the site with `X-Robots-Tag: noindex`.
- `POST /admin/register-admin` on the CMS URL returns 403 from a network that isn't on the list. `/admin` itself is open on dev (D31).

## Rollback
In Render, open the service → **Events**, pick the last good deploy → **Rollback**. Then revert the bad PR on `dev` so the next deploy doesn't bring it back ([roll-back-release](./roll-back-release.md)).

## Escalation
Art → Danish. If a secret leaked, follow [rotate-secrets](./rotate-secrets.md) first.
