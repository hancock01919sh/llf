# Proof Doc: Long Live Food

Technical spikes that prove (or disprove) the riskiest assumptions in the [TDD](./TDD.md). Under the ddd Tech Process this is owned by tech. Most spikes run during **tech validation, Oct 8–16**, and their decisions feed **TDD v1.0**.

**Gates:** the **Oct 16** scaffolding release needs P1–P5, P8, and P9. Scaffolding runs on a **synthetic fixture seed**, so it doesn't wait for content. The validated project seed (P6) and environment transfer (P7) are the **Oct 21** seed gate. P10 and P11 gate the AWS staging move (Nov 25). See [TDD §11.5](./TDD.md#115-release-gates).

| | |
|---|---|
| **Owner** | Art Longbottom (tech lead) |
| **Last updated** | 2026-10-06 |

**How to run a spike**
- Time-box it (default **½–1 day**). Work on a `spike/<id>-<name>` branch; spike code is thrown away or rewritten, never merged as is.
- Write down the **hypothesis** and **method** before starting, then fill in the **result** and **decision**.
- If the result changes the design, update the TDD section and the decision log (§14) in the same PR.

Status key: ⏳ not started · 🔬 in progress · ✅ confirmed · ❌ disproved (design changed)

## Summary

| ID | Spike | TDD | Owner | Due | Status |
|---|---|---|---|---|---|
| P1 | Strapi relation semantics | §5.1, §5.2 | Art | Oct 14 | ⏳ |
| P2 | Strapi 5 in a pnpm workspace | §4.4 | Art | Oct 12 | ⏳ |
| P3 | Static export routing and `?i=` | §6.2 | Art | Oct 15 | ⏳ |
| P4 | Render client-IP header for the admin allow-list | §5.4, §10 | Art | Oct 14 | ⏳ |
| P5 | Publish → rebuild (Render deploy hook; Phase B relay via GitHub App) | §5.3 | Art | Oct 16 | ⏳ |
| P6 | Scrape → seed pipeline | §5.5 | China team + Art | Oct 21 | ⏳ |
| P7 | `strapi transfer` between environments (incl. media) | §5.5, §12.2 | Art | Oct 21 | ⏳ |
| P8 | JSON-LD hit rate on real recipe URLs | §7.4 | Art | Oct 16 | ⏳ |
| P9 | Model eval baseline (dev key) | §7.7, §7.9 | Art | Oct 16 | ⏳ |
| P10 | WAF Challenge / JS integration with the tool API | §7.6 | James S + Art | Nov 6 | ⏳ |
| P11 | Render → AWS parity | §12.2 | James S + Art | Nov 13 | ⏳ |
| P12 | CMS fully IP-only (build in CodeBuild inside the VPC) | §9.2 | James S | Only if IT requires | ⏳ |

## Spikes

### P1. Strapi relation semantics
- **Hypothesis:** The one-way `oneToOne` (Tip → taxonomy) and `oneToMany` (Category → ingredients/tips, component relations) declarations in the inherited schema **prevent** the same target from being linked by more than one source, which breaks the intended model.
- **Method:** Local Strapi on Postgres with the inherited schema. Link two Tips to the same Tip Type; add one Ingredient to two Categories; check the admin UI, the REST API, and the join-table constraints.
- **Result:** _TBD_
- **Decision:** Redeclare each relation to match intent (manyToOne / manyToMany) using the two-phase migration in TDD §5.2, whatever the result.

### P2. Strapi 5 in a pnpm workspace
- **Hypothesis:** Strapi 5 builds and runs (`develop`, `build`, Docker image) as `apps/cms` inside a pnpm workspace without hoisting hacks.
- **Method:** `git subtree add`, then `pnpm install`, `pnpm --filter @llf/cms build`, and a Docker build. Try `node-linker=hoisted` only for `apps/cms` if needed.
- **Result:** _TBD_
- **Decision:** If it fails, `apps/cms` keeps its own npm lockfile and sits outside the workspace (TDD §4.4).

### P3. Static export routing and `?i=`
- **Hypothesis:** `output: 'export'` with `trailingSlash: true` serves every route in TDD §6.1, with the results page reading `?i=` via `useSearchParams` inside Suspense, identically through the Phase A Node server and a CloudFront Function.
- **Method:** Minimal Next.js app with the route list, a 404 page, and the results page. Serve with `server.mjs` (basic auth) and with a CloudFront Function test harness.
- **Result:** _TBD_
- **Decision:** Feeds OPEN-4 (static vs SSR), due Oct 16.

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
