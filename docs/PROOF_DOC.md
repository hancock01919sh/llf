# Proof Doc: Long Live Food

Technical spikes that prove (or disprove) the riskiest assumptions in the [TDD](./TDD.md). Under the ddd Tech Process this is owned by tech. Most spikes run during **tech validation, Oct 8–16**, and their decisions feed **TDD v1.0**.

**Gates:** the **Oct 16** scaffolding release needs P1–P5, P8, P9, and P13. Scaffolding runs on a **synthetic fixture seed**, so it doesn't wait for content. The validated project seed (P6) and environment transfer (P7) are the **Oct 21** seed gate. P10 and P11 gate the AWS staging move (Nov 25). See [TDD §11.5](./TDD.md#115-release-gates).

| | |
|---|---|
| **Owner** | Art Longbottom (tech lead) |
| **Last updated** | 2026-10-07 |

**How to run a spike**
- Time-box it (default **½–1 day**). Work on a `spike/<id>-<name>` branch; spike code is thrown away or rewritten, never merged as is.
- Write down the **hypothesis** and **method** before starting, then fill in the **result** and **decision**.
- If the result changes the design, update the TDD section and the decision log (§14) in the same PR.

Each spike has a Jira ticket (label `spike`) in project BD3244 ([board](https://dotdotdash.atlassian.net/jira/software/projects/BD3244/boards/873/backlog)) with its hypothesis, method, and decision rule. Record the result here and close the ticket.

Status key: ⏳ not started · 🔬 in progress · ✅ confirmed · ❌ disproved (design changed)

## Summary

| ID | Jira | Spike | TDD | Owner | Due | Status |
|---|---|---|---|---|---|---|
| P1 | [BD3244-23](https://dotdotdash.atlassian.net/browse/BD3244-23) | Strapi relation semantics | §5.1, §5.2 | Art | Oct 14 | ⏳ |
| P2 | [BD3244-13](https://dotdotdash.atlassian.net/browse/BD3244-13) | Strapi 5 in a pnpm workspace | §4.4 | Art | Oct 12 | ✅ |
| P3 | [BD3244-22](https://dotdotdash.atlassian.net/browse/BD3244-22) | Static export routing and `?i=` | §6.2 | Art | Oct 15 | ✅ |
| P4 | [BD3244-28](https://dotdotdash.atlassian.net/browse/BD3244-28) | Render client-IP header for the admin allow-list | §5.4, §10 | James S + Art | Oct 14 | ⏳ |
| P5 | [BD3244-27](https://dotdotdash.atlassian.net/browse/BD3244-27) | Publish → rebuild (Render deploy hook; Phase B relay via GitHub App) | §5.3 | James S + Art | Oct 16 | ⏳ |
| P6 | [BD3244-30](https://dotdotdash.atlassian.net/browse/BD3244-30) | Scrape → seed pipeline | §5.5 | China team + Art | Oct 21 | ⏳ |
| P7 | [BD3244-34](https://dotdotdash.atlassian.net/browse/BD3244-34) | `strapi transfer` between environments (incl. media) | §5.5, §12.2 | James S + Art | Oct 21 | ⏳ |
| P8 | [BD3244-32](https://dotdotdash.atlassian.net/browse/BD3244-32) | JSON-LD hit rate on real recipe URLs | §7.4 | Art | Oct 16 | ⏳ |
| P9 | [BD3244-33](https://dotdotdash.atlassian.net/browse/BD3244-33) | Model eval baseline (dev key) | §7.7, §7.9 | Art | Oct 16 | ⏳ |
| P10 | [BD3244-31](https://dotdotdash.atlassian.net/browse/BD3244-31) | WAF Challenge / JS integration with the tool API | §7.6 | James S + Art | Nov 6 | ⏳ |
| P11 | [BD3244-35](https://dotdotdash.atlassian.net/browse/BD3244-35) | Render → AWS parity | §12.2 | James S + Art | Nov 13 | ⏳ |
| P12 | [BD3244-29](https://dotdotdash.atlassian.net/browse/BD3244-29) | CMS fully IP-only (build in CodeBuild inside the VPC) | §9.2 | James S | Only if IT requires | ⏳ |
| P13 | [BD3244-26](https://dotdotdash.atlassian.net/browse/BD3244-26) | Hybrid content model + agent copy-change flow | §5.2, §6.4, D21 | Art + China team leads | Oct 16 | ⏳ |

## Spikes

### P1. Strapi relation semantics
- **Hypothesis:** The one-way `oneToOne` (Tip → taxonomy) and `oneToMany` (Category → ingredients/tips, component relations) declarations in the inherited schema **prevent** the same target from being linked by more than one source, which breaks the intended model.
- **Method:** Local Strapi on Postgres with the inherited schema. Link two Tips to the same Tip Type; add one Ingredient to two Categories; check the admin UI, the REST API, and the join-table constraints.
- **Result:** _TBD_
- **Decision:** Redeclare each relation to match intent (manyToOne / manyToMany) using the two-phase migration in TDD §5.2, whatever the result.

### P2. Strapi 5 in a pnpm workspace
- **Hypothesis:** Strapi 5 builds and runs (`develop`, `build`, Docker image) as `apps/cms` inside a pnpm workspace without hoisting hacks.
- **Method:** `git subtree add`, then `pnpm install`, `pnpm --filter @llf/cms build`, and a Docker build. Try `node-linker=hoisted` only for `apps/cms` if needed.
- **Result:** ✅ **Confirmed** (Oct 7, scratch repo, Node 22.14, pnpm 9.15.2, Strapi 5.45.0, Postgres 16).
  - `git subtree add` of `f753967` into `apps/cms` kept the history. **No hoisting needed**: the default isolated linker installs and builds with no `.npmrc` changes.
  - The only peer warnings come from inside Strapi's own dependency tree (zod `3.25.67` vs `^3.25.76` via the `ai` SDK; typedoc; codemirror). None of them blocks anything.
  - Running `strapi develop` and `strapi start` against Postgres 16 in Docker: `/_health` → 204, `/admin` → 200, 78 tables created, and all 9 content APIs → **403** (the Public role has no permissions).
  - **Docker image:** a multi-stage `node:22-alpine` build (`pnpm fetch` → offline frozen install filtered to `@llf/cms...` → `strapi build` → `pnpm deploy --filter @llf/cms --prod`, then copy `build/`). It runs as the `node` user with a `/_health` healthcheck. The container started against compose Postgres with the same 204/200/403 results. The image is **1.09 GB** (size can be trimmed later; it's not a blocker).
  - **Gotchas:** this JS project writes its admin bundle to **`build/`, not `dist/`**. The admin build bakes in `ADMIN_PATH`, `STRAPI_ADMIN_BACKEND_URL`, and `STRAPI_TELEMETRY_DISABLED`, so build each environment with its own values. If a local Homebrew Postgres already uses 5432, set `POSTGRES_PORT` (compose) and `DATABASE_PORT`.
  - **Audit fixes applied in the spike** (they go into the real scaffold): renamed the package to `@llf/cms`; removed `@strapi/plugin-cloud`, `better-sqlite3`, the `deploy` script, and `package-lock.json`; added `pg`; set engines to Node 22; made `config/database.js` Postgres-only (`DATABASE_URL` or `DATABASE_*`, plus SSL, schema, and pool); removed `webhooks.populateRelations`.
  - **New findings for §5.1:**
    - The Strapi 5.45 admin depends on the Vercel `ai` SDK for **Strapi AI**. It only turns on when `admin.ai.enabled` (default `true`) **and** an Enterprise `cms-ai` license are both present. We have no license, so it's off, but we set `admin.ai.enabled: false` explicitly and keep the dependency on the third-party list.
    - `config/admin.js` uses the deprecated `auth.options.expiresIn`. Move it to `auth.sessions` in the scaffold.
- **Decision:** `apps/cms` **stays inside the pnpm workspace**, on one lockfile and the default linker. Postgres 16 runs everywhere: Docker locally, then Render Postgres, then **RDS Postgres 16** (D13). The fallback (a separate npm lockfile) isn't needed. The spike Dockerfile and compose file are the templates for BD3244-16.

### P3. Static export routing and `?i=`
- **Hypothesis:** `output: 'export'` with `trailingSlash: true` serves every route in TDD §6.1, with the results page reading `?i=` via `useSearchParams` inside Suspense, identically through the Phase A Node server and a CloudFront Function.
- **Method:** Minimal Next.js app with the route list, a 404 page, and the results page. Serve with `server.mjs` (basic auth) and with a CloudFront Function test harness.
- **Result (Oct 7):** ✅ Confirmed, with one fix.
  - **Bug found:** `serve-handler`'s own trailing-slash 301 **dropped the query string**, so `/find-my-tips/results?i=apple` lost `?i=`. Fixed with `apps/web/lib/slash-redirect.mjs`: `server.mjs` now issues the 301 itself (path + `/` + the original query) before `serve-handler` runs. Leading `//` or `\` is collapsed so `Location` can't point at another host. Covered by 5 unit tests and an e2e test.
  - **Phase A server:** `pnpm e2e` 22/22 (desktop and mobile, axe on every page). Checked by hand on a local port with `BASIC_AUTH` set: no or wrong credentials → 401, correct → 200; `/find-my-tips/results?i=apple,banana` → 301 to `/find-my-tips/results/?i=apple,banana`; an unknown path → branded 404; `/healthz` → 200 without auth.
  - **Suspense:** with the `<Suspense>` wrapper removed, `next build` (static export) **fails** with a prerender error on `/find-my-tips/results`. The build itself enforces the rule, so no extra lint rule is needed.
  - **Phase B function:** `infra/cloudfront-functions/src/site-viewer-request.js` (cloudfront-js-2.0) implements TDD §6.2 steps 1–5. 9 unit tests against a mock KeyValueStore: `/api` guard, host redirect plus slash in one 301, query kept on both 301s, directory index, release prefix, **503** when the release key is missing or invalid, and no `for…of` (not supported by the runtime). **Not deployed yet** (needs AWS access).
- **Decision:** **Static export is viable** for every §6.2 route. `?i=` stays a query string, served through a query-preserving slash 301 on both phases. We recommend static for **OPEN-4**; it still needs Ad Council sign-off (due Oct 16). Deploying and smoke-testing the function on a real distribution moves to the Phase B infra work.

### P4. Render client-IP header for the admin allow-list
- **Hypothesis:** Render's proxy sets a client-IP header (e.g. the last entry of `X-Forwarded-For`, or a Render-specific header) that a client **can't spoof**, so Strapi middleware can enforce the admin allow-list.
- **Method:** Deploy a tiny echo service on Render. Send requests with forged `X-Forwarded-For` / `X-Real-IP` headers from known IPs and compare what arrives.
- **Result:** _TBD_
- **Decision:** If spoofable, add basic auth on `/admin` paths as well (TDD §10). Render's own inbound IP rules need a higher plan (TDD §5.4).

### P5. Publish → rebuild
- **Hypothesis:** A Strapi webhook on `entry.publish` / `entry.unpublish` / `entry.delete` / `media.*` can trigger a Render deploy hook (Phase A), and a relay Lambda → `repository_dispatch` (Phase B), with bursts coalesced by GitHub Actions concurrency.
  - The Phase B relay has its own **Lambda Function URL**, checks the webhook secret, and authenticates as a **GitHub App** installed on this repo only (Contents: write), minting a short-lived installation token per call. No PATs.
  - `repository_dispatch` runs the workflow from the **default branch** (`dev`), so the workflow checks out the target branch from `client_payload.env` against an allow-list.
- **Method:** Webhook to a request bin, check the payloads (Strapi 5), then wire the Render deploy hook. Publish 10 entries in a minute and count the builds. For Phase B, run the relay locally against a test GitHub App on a scratch repo: send a dispatch for `staging`, confirm the run checks out `staging`, and confirm an unknown `env` is rejected. Optionally, fire `entry.update` and confirm the preview build (TDD §5.2) runs in its own concurrency group.
- **Result:** _TBD_
- **Decision:** Confirms TDD §5.3.

### P6. Scrape → seed pipeline
- **Hypothesis:** We can produce a validated seed set (ingredients, synonyms, tips, categories, groups, taxonomies, one sample page) from the agreed source (OPEN-30) and import it idempotently into an empty Strapi.
- **Method:** Scrape or extract a small sample to JSON, validate with the `contracts` Zod schemas, import through the REST/Document API, re-run to prove idempotency.
- **Result:** _TBD_
- **Decision:** Confirms TDD §5.5 and D19.

### P7. `strapi transfer` between environments
- **Hypothesis:** `strapi transfer` moves content **and media** from Render to Render, and Render to AWS (local disk → S3 provider), without manual fixes.
- **Method:** Transfer the seed set between two Render environments, then from Render to a local Strapi using the S3 provider against a test bucket.
- **Result:** _TBD_
- **Decision:** If media doesn't transfer across providers, add a media re-upload step to the runbook.

### P8. JSON-LD hit rate
- **Hypothesis:** Most recipe URLs that users will paste (top US recipe sites) expose `Recipe` JSON-LD with `recipeIngredient`, so the model is skipped for them.
- **Method:** 50 URLs from the top recipe sites, run through `safeFetch` + the JSON-LD parser. Record the hit rate, failures, and bot blocks.
- **Result:** _TBD_
- **Decision:** Sets the expected AI cost (TDD §9.5) and the eval mix.

### P9. Model eval baseline
- **Hypothesis:** A current Anthropic model on ddd's dev key reaches the G2 target (precision ≥ 0.9, recall ≥ 0.8) on receipts and lists, with a 100% injection pass rate.
- **Method:** `pnpm eval --provider anthropic` on the v0 labeled set (80–120 items), within a fixed budget.
- **Result:** _TBD_
- **Decision:** Baseline for the production provider decision (OPEN-1, Nov 13).

### P10. WAF Challenge with the tool API
- **Hypothesis:** The WAF JS integration SDK lets `POST /api/find-tips/*` pass a Challenge from our static site without a page reload, and the client can handle a 202 challenge response.
- **Method:** CloudFront + WAF in AWS dev with a Challenge rule on the API path; call it from a static page with the SDK.
- **Result:** _TBD_
- **Decision:** Confirms TDD §7.6. Fallback: CAPTCHA action only for repeat offenders.

### P11. Render → AWS parity
- **Hypothesis:** The same artifacts and env-var contract run on Render and AWS: seed, publish → build → release pointer, tool smoke tests, admin IP restriction.
- **Method:** Run the full smoke suite against Render staging and AWS staging.
- **Result:** _TBD_
- **Decision:** Gate for moving staging to AWS on Nov 25 (TDD §12.2).

### P12. CMS fully IP-only
- **Hypothesis:** If IT requires the CMS `/api/*` to be IP-restricted too, a CodeBuild project inside the VPC (triggered by the relay) can build and publish the site.
- **Method:** Only run if IT asks. CodeBuild in the VPC with a VPC endpoint to S3; run the `deploy-site` steps.
- **Result:** _TBD_
- **Decision:** TDD §9.2.

### P13. Hybrid content model and agent copy-change flow
- **Hypothesis:** Templates in code with CMS slots, blocks only for generic pages, and site strings in typed `content/*.ts` files (TDD D21) are faster to build and easier to hand off than a full page builder. A copy change filed as an issue can go issue → Copilot coding agent → PR → Render preview → merge in under an hour of human time, with no CMS change.
- **Method:** Build the Home template (hero slot + featured relations) and the generic template (two blocks) against the fixture seed. Add `content/strings.ts` with Zod validation and a type-checked key lookup. File three sample copy-change issues and assign them to the coding agent; record time to a reviewable PR, preview, and merge, and any mistakes. Walk the China team leads through it and collect their feedback. Check whether the agent and its Jira integration are available to us (OPEN-32).
- **Result:** _TBD_
- **Decision:** Confirm or adjust D21 (TDD §14). If the agent isn't allowed, the same flow runs with a developer making the PR. Any string the client expects to edit often moves into the CMS (R16).
