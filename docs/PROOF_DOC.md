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
| P1 | [BD3244-23](https://dotdotdash.atlassian.net/browse/BD3244-23) | Strapi relation semantics | §5.1, §5.2 | Art | Oct 14 | ✅ (admin UI picker unchecked) |
| P2 | [BD3244-13](https://dotdotdash.atlassian.net/browse/BD3244-13) | Strapi 5 in a pnpm workspace | §4.4 | Art | Oct 12 | ✅ |
| P3 | [BD3244-22](https://dotdotdash.atlassian.net/browse/BD3244-22) | Static export routing and `?i=` | §6.2 | Art | Oct 15 | ✅ |
| P4 | [BD3244-28](https://dotdotdash.atlassian.net/browse/BD3244-28) | Render client-IP header for the admin allow-list | §5.4, §10 | James S + Art | Oct 14 | ⏳ |
| P5 | [BD3244-27](https://dotdotdash.atlassian.net/browse/BD3244-27) | Publish → rebuild (Render deploy hook; Phase B relay via GitHub App) | §5.3 | James S + Art | Oct 16 | ⏳ |
| P6 | [BD3244-30](https://dotdotdash.atlassian.net/browse/BD3244-30) | Scrape → seed pipeline | §5.5 | China team + Art | Oct 21 | ⏳ |
| P7 | [BD3244-34](https://dotdotdash.atlassian.net/browse/BD3244-34) | `strapi transfer` between environments (incl. media) | §5.5, §12.2 | James S + Art | Oct 21 | ⏳ |
| P8 | [BD3244-32](https://dotdotdash.atlassian.net/browse/BD3244-32) | JSON-LD hit rate on real recipe URLs | §7.4 | Art | Oct 16 | ✅ |
| P9 | [BD3244-33](https://dotdotdash.atlassian.net/browse/BD3244-33), [BD3244-37](https://dotdotdash.atlassian.net/browse/BD3244-37) (arena) | Model eval baseline and cross-vendor arena | §7.7, §7.9 | Art | Oct 16 (baseline), Nov 13 (pick) | 🔬 harness + arena built; preliminary live run done |
| P10 | [BD3244-31](https://dotdotdash.atlassian.net/browse/BD3244-31) | WAF Challenge / JS integration with the tool API | §7.6 | James S + Art | Nov 6 | ⏳ |
| P11 | [BD3244-35](https://dotdotdash.atlassian.net/browse/BD3244-35) | Render → AWS parity | §12.2 | James S + Art | Nov 13 | ⏳ |
| P12 | [BD3244-29](https://dotdotdash.atlassian.net/browse/BD3244-29) | CMS fully IP-only (build in CodeBuild inside the VPC) | §9.2 | James S | Only if IT requires | ⏳ |
| P13 | [BD3244-26](https://dotdotdash.atlassian.net/browse/BD3244-26) | Hybrid content model + agent copy-change flow | §5.2, §6.4, D21 | Art + China team leads | Oct 16 | 🔬 content model ✅; agent flow blocked |

## Spikes

### P1. Strapi relation semantics
- **Hypothesis:** The one-way `oneToOne` (Tip → taxonomy) and `oneToMany` (Category → ingredients/tips, component relations) declarations in the inherited schema **prevent** the same target from being linked by more than one source, which breaks the intended model.
- **Method:** Local Strapi on Postgres with the inherited schema. Link two Tips to the same Tip Type; add one Ingredient to two Categories; check the admin UI, the REST API, and the join-table constraints.
- **Result:** ✅ **Confirmed in part** (Oct 12, Strapi 5.45.0, Postgres 16, empty database, inherited schema first and then the fixed one). The static review was right about the declarations, but the runtime doesn't enforce what the hypothesis feared.
  - **Findings checked against the schema files:** all four hold. Tip `tip_type`, `tip_behavior`, and `tip_motivator` were one-way `oneToOne`. Category `ingredients` and `tips` were one-way `oneToMany`. `carousel.categories`, `link-list.pages`, and `tip-list.tips` were one-way `oneToMany`. `shared.cta.page` was `oneToOne`. **One more found:** `Page.featured` was one-way `oneToMany`.
  - **Behavior of the inherited schema:** nothing was blocked. `scripts/check-cms-relations.mjs` (REST, full-access token) linked one target from several sources and read every link back: 3 Tips on one taxonomy term (each of the three taxonomies), one Ingredient and one Tip in two Categories, the same Categories, Pages, and Tips in carousel, link-list, and tip-list blocks on two Pages, one CTA target on two Pages, and one Category featured on two Pages. All 7 checks passed. The join tables (`*_lnk`) carry a unique index on the **(source, target) pair only**, never on the target alone. The one-way declared type only decides the cardinality the admin and API validate, not a database constraint.
  - **Fix applied:** Tip taxonomies and `shared.cta.page` → `manyToOne`. Category `ingredients`/`tips`, `Page.featured`, and the carousel, link-list, and tip-list relations → `manyToMany`. `tip_motivator` is `manyToOne` for now (TDD §5.2 leaves manyToMany for content to decide).
  - **Data safety:** a `pg_dump -s` before and after the edit and a Strapi restart are **identical**: no table, column, or index changed. No data moves, so the expand/contract migration wasn't needed. Re-running the same 7 checks on the fixed schema passes, and `pnpm seed` (fixtures, then again for idempotency) verifies against the site schemas. Several Tips share a taxonomy row in the join table (for example one Tip Type on 6 Tips).
  - **API shape:** unchanged. Single-target relations stay objects (`tip_type`, `cta.page`) and multi-target ones stay arrays, so `packages/contracts`, the seed, and the web app needed no changes.
  - **Not tested:** the admin UI relation picker (whether it hides already-linked targets). Check it by hand on Render dev at the next admin session. This run also used a Homebrew `postgresql@16` binary on a private port because the Docker daemon wasn't running. The engine and major version match compose.
- **Decision:** Redeclare each relation to match intent (manyToOne / manyToMany), edited in place (TDD D26). **Assumption:** the only data in any existing environment is seed data (TDD §5.2 says real content starts about end of Oct), and the DDL is unchanged, so in-place is safe even if an environment has data. **Follow-up:** any environment that already ran the inherited schema picks up the change on the next boot with no DDL. Run `scripts/check-cms-relations.mjs` once on Render dev after the deploy. Phase 2 doesn't apply here. Keep expand/contract for changes that alter tables or columns, such as the planned Tip `ingredients` manyToMany (OPEN-14).

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
- **Method:** 63 URLs from 13 top US recipe sites (about 5 each), sampled at random (seed 3244) from each site's sitemap and filtered to recipe pages. Each URL went through the real `safeFetch` with production defaults (3 redirects, 3 MB, 5 s) and `extractRecipeIngredients`, 750 ms apart, from a ddd office IP. Two passes: our honest bot user agent (`LongLiveFoodBot/0.1`), then a desktop browser user agent for comparison only. The harness was a temporary script, not committed. It recorded only the status, HTTP code, ingredient-line count, latency, and the public URL, never page content.
- **Result (Oct 7):** ✅ Hypothesis holds for pages we can fetch. The main risk is bot blocking, not extraction.
  - **Extraction:** every page that returned 200 had `Recipe` JSON-LD with `recipeIngredient` (37/37). 0 pages needed the model. Ingredient lines per recipe: min 4, median 10, max 21.
  - **Hit rate (honest UA):** 37/63 (59%). 25 blocked with 403, 1 timeout, 0 "no recipe", 0 not found. Hit latency: median 170 ms, max 2.5 s.
  - **By site (honest UA):** 5/5 on bonappetit, tasteofhome, budgetbytes, epicurious, bbcgoodfood, and sallysbaking. delish 3/4 (1 timeout). thekitchn 4/5 (1 Varnish 403). **0/5 on allrecipes, simplyrecipes, seriouseats, and eatingwell** (all Dotdash Meredith, Cloudflare 403). pinchofyum 0/4 (CloudFront 403).
  - **Browser UA (comparison):** **worse**, 28/63 (44%), 35 blocked. Dotdash Meredith still blocked every request, so that block is based on IP or TLS fingerprint, not the user agent. budgetbytes and sallysbaking (Cloudflare) and thekitchn (Varnish) started blocking. pinchofyum and delish improved to 4/4.
  - **Failure path:** checked in code. A blocked or failed fetch becomes `upstream_error` (HTTP 502) or `timeout` and **never reaches the model**.
- **Decision:**
  - **Keep the honest bot user agent.** Spoofing a browser scored worse and raises terms-of-service concerns.
  - **Plan for a 40–50% URL failure rate.** Real traffic probably leans toward allrecipes, the largest US recipe site. A blocked site needs its own Tool Copy that suggests pasting the ingredients or uploading a photo instead, with **no retry** (it would fail the same way). Added to the §7.10 states, to OPEN-34 for design, and as risk R20.
  - **AI cost (§9.5):** URL requests cost about $0 in model calls. The model fallback only runs for 200 pages without JSON-LD, which was 0% here. AI cost is driven by photo and typed-text input.
  - **Eval mix (§7.9):** non-JSON-LD pages are rare in practice, so the eval uses **synthesized** non-JSON-LD pages to cover the fallback, plus blocked-site and timeout error cases.
  - **Watch in production:** the `upstream_error` and `timeout` rate on URL input, from the existing error metrics (error code and input type only; no URLs or domains are logged, TDD §7.6). A distinct error code for blocked recipe pages, `source_unavailable` (HTTP 424, no auto-retry, "Site blocked" copy), is implemented (BD3244-36), so blocked pages no longer count toward `upstream_error`.

### P9. Model eval baseline
- **Hypothesis:** A current Anthropic model on ddd's dev key reaches the G2 target (precision ≥ 0.9, recall ≥ 0.8) on receipts and lists, with a 100% injection pass rate.
- **Method:** `pnpm eval -- --provider anthropic --model <model> --price-in <usd> --price-out <usd> --budget <usd>` on the v0 labeled set (80–120 items). The run report (`eval/reports/<stamp>.md`) is committed; the raw run (`eval/runs/`) is git-ignored. Usage is in the [Find My Tips README](../services/find-my-tips/README.md#model-eval-p9).
- **Result (Oct 7):** 🔬 Harness built; the live run is **blocked**.
  - **Built (BD3244-33):** the Anthropic adapter (strict tool mode, Zod-validated), the versioned prompt `p1`, and the eval CLI (`services/find-my-tips/src/eval/`): per-case precision, recall, readable flag, injection pass, latency, tokens, and cost; a spend budget; `--strict` to fail a run that misses G2; and a Markdown report.
  - **Smoke set:** `eval/sets/v0-synthetic.json`, 15 synthetic text cases (lists, recipes, a receipt, unreadable input, and injection attempts). It checks the harness only and **is not** the G2 gate.
  - **Mock baseline:** 11/15 cases pass (precision 91.2%, recall 96.9%, readable 93.3%, injection 50%). The 4 failures are by design: they prove the harness catches extra terms, missing terms, a wrong readable flag, and injected terms.
  - **Blocked on:** the Anthropic dev key (IT acceptance, OPEN-2, Oct 16); the 80–120 item labeled set with rights-cleared images (no people or personal data); budget approval for the run; the model and its per-token prices; and the accuracy bar (OPEN-8, Nov 20). The `eval.yml` workflow (manual trigger) is not built yet (James S).
- **Arena prep (Oct 8, BD3244-37):** 🔬 Built; live runs are **blocked**.
  - **Built:** the `openai` adapter (strict JSON schema, Zod-validated, `AI_REASONING_EFFORT`), the `gemini` adapter (JSON response schema, Zod-validated, thinking budget; ddd's own key, D25), and `pnpm arena`, which runs every enabled cell in a matrix (`eval/arena.example.json`) on the same set and prompt, with per-cell and global budgets and a `--dry-run`. The scorecard (`eval/reports/arena-<stamp>.md`) adds not-food rejection, p50/p95, $/call, and a **$/month forecast** at 25K and 50K uses against the ~$500/month cap (`callsPerUse: 2` if we add a guardrail pre-call).
  - **Matrix `arena-v0`** ($20 global budget): mock; `claude-haiku-4-5`; `gpt-5-mini` and `gpt-5-nano` at reasoning `minimal` and `low`; `gemini-2.5-flash-lite` (enabled; ddd's key, test data only). Prices are assumed list prices and must be re-checked on the run date.
  - **Labeled sets** now carry provenance (source, rights, PII-checked). Every image case must name a source, and the loader refuses a set with an unknown or un-reviewed source. See [`eval/sets/README.md`](../eval/sets/README.md).
  - **Mock smoke:** $0 spent; it ran the mock cell, skipped the others with reasons, and the mock failed the bar on injection (50%), as designed.
  - **Blocked on:** the Anthropic dev key (OPEN-2) and TBWA's OpenAI test key; the labeled set and the CMS ingredient catalog; and rights-cleared images for image cases. (The ≤1 MP resize is now built.)
  - Drafts for the client, Legal, and IT are in [`docs/eval/arena/`](eval/arena/README.md).
- **Preliminary live arena (Oct 12, BD3244-37 / BD3244-33):** ✅ ran all 7 cells, no cell failed, **$0.04 spent** of a $3 cap. **PRELIMINARY: 15 synthetic text cases (only 2 injection cases); the 80–120 item labeled set is still pending (OPEN-8).** Report: [`eval/reports/arena-2026-10-12T205919Z.md`](../eval/reports/arena-2026-10-12T205919Z.md). Command: `pnpm arena -- --budget 3`. Prices are assumed list prices (Oct 2025), not re-checked.
  - Meets the G2 bar on this set: `claude-haiku-4-5` (100% / 100%, injection 100%, $0.0017/call, $83.76/mo at 50K), `gpt-5-mini` minimal (100% / 100%, 100%, $0.0002/call, $10.80/mo) and low (100% / 100%, 100%, $0.0004/call, $21.87/mo).
  - Misses: `gpt-5-nano` minimal (91.2% / 96.9%, injection 0%) and low (91.4% / 100%, injection 0%); `gemini-2.5-flash-lite` (91.4% / 100%, injection 50%, $0.0001/call). The mock baseline fails as designed.
  - Every cell is within the $500/month cap at 25K and 50K uses. Latency p50: 0.6–3.0 s.
  - **Built:** ≤1 MP image downscale before every model call (`downscaleImage` in `image.ts`, `sharp`, in memory only; applied in `extractIngredients` so all providers share it). Image cases are not yet run: they need rights-cleared images.
  - This is not a recommendation; OPEN-1 is Ad Council's decision.
- **Arena v1, Oct 2026 model audit (Oct 13, BD3244-37):** ✅ 12 candidates and 1 reference, **$2.86 spent**. Set `v1-mixed` (94 Nutrition5k dishes + 32 non-food images), catalog `eval-v1`, prompt `p1`, matrix [`eval/arena-v1.json`](../eval/arena-v1.json) with official list prices from Oct 13, 2026. Report: [`eval/reports/arena-2026-10-13T232648Z-v1.md`](../eval/reports/arena-2026-10-13T232648Z-v1.md) (Opus ran separately and was merged).
  - **Reference:** `claude-opus-5-5` (Art's call: a quality yardstick, not a candidate), precision 73.5%, recall 96.9%, not-food rejected 100%, $389/mo at 50K. Its low precision mostly reflects extra plausible ingredients the Nutrition5k labels leave out, so it's a recall ceiling, not ground truth.
  - **Best within the cap:** `gemini-3.5-flash-lite`, 88.6% / 90.2%, not-food rejected 96.9%, $28/mo at 50K. Next: `gemini-3.8-flash` (79.0% / 94.5%, 100%, $91/mo) and `gemini-3.1-flash-lite` (82.0% / 89.6%, 87.5%, $21/mo). No cell meets G2; precision is the gap.
  - The report's new **What the budget buys** / **What it misses out on** sections show the gap to the reference: 3.5 Flash-Lite misses 11 ingredients Opus found (mostly cheese and egg) and accepts 1 non-food image Opus rejected.
  - **Adapter fix:** Sonnet 5.5, Opus 5.5 and Fable 5.1 reject a forced `tool_choice`, so the Anthropic adapter now uses structured outputs (TDD §7.4). `gpt-6.1-sol` rejects effort `none`.
  - Gemini and Anthropic are dev/eval keys pending IT (OPEN-2). Not a recommendation; OPEN-1 is Ad Council's decision.
- **Arena v2 and recipe input (Oct 14, BD3244-37):** ✅ $8.14 spent. Write-up: [`docs/eval/arena/recipes-2026-10.md`](eval/arena/recipes-2026-10.md).
  - **Label fixes** (catalog `eval-v2`, set `v2-mixed`, same images): with "tomato sauce" no longer scored as `ketchup` and with acceptable extras, **7 of 13 cells meet G2**. Precision rose 8–21 points; recall barely moved. Cheapest passing cells: `gemini-2.5-flash-lite` 92.3% / 84.3% ($4/mo, but accepts 59% of non-food images), `gpt-5-mini/minimal` 90.0% / 87.6% ($18/mo), `gemini-3.1-flash-lite` 96.4% / 87.6% ($22/mo), `gemini-3.5-flash-lite` 96.2% / 82.2% ($28/mo). Opus: 94.2% / 96.8%.
  - **Recipes** (`v2-recipes`, 61 cases): JSON-LD recipe pages score 100% / 99% with no model call. With prompt `p2`, every cell scores ≥ 99% / ≥ 99% with 3/3 injection; `p1` misses typed dish names (recall 57–98%). `p2` is the eval candidate for the next prompt version.
- **Decision:** Baseline for the production provider decision (OPEN-1, Nov 13). The pick is the cheapest arena cell that meets G2 with 100% injection resistance and fits the monthly cap (TDD D24). The Bedrock adapter stays a stub until OPEN-1 is decided.

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
- **Result (Oct 7):** 🔬 Content model ✅ confirmed; agent copy-change flow not run yet.
  - **Templates and slots:** Page has a required `template` enum (`generic`, `home`, `find-my-tips`, `library`; default `generic`) with conditional slots: `hero`, `intro`, and `featured` (Category relation) on Home; `tool` (Tool Copy) on Find My Tips; `main` (dynamic zone) on generic and Home. Admins only see the fields for the chosen template. `packages/contracts` validates each slot, and the seed schema rejects a slot on the wrong template.
  - **Live on Strapi 5.45 + Postgres 16:** the fixture seed creates and then re-runs idempotently (slots included; `featured` uses `set`), populate reads every slot back, and the web loader renders `/` as Home (hero, intro, 4 featured categories), `/find-my-tips/` with its Tool Copy, and the other pages as generic. An unknown or missing template falls back to generic.
  - **Site strings:** `apps/web/content/strings.ts` is Zod-validated at import with a type-checked key lookup and `format()` placeholders. 9 template tests plus the string tests pass (web 111 tests).
  - **Copy-change form:** `.github/ISSUE_TEMPLATE/copy-change.yml` (page, current text, new text, reason, Jira key, scope check; label `copy-change`).
  - **Not done:** the three sample issues → coding agent → PR → preview → merge timing, and the China leads walkthrough. Blocked on OPEN-32 (agent and Jira integration), GitHub push access (BD3244-16), and Render PR previews (BD3244-15).
- **Decision:** Confirm or adjust D21 (TDD §14). So far D21 holds: the template + slot model works with no page builder. Re-run the agent half once access lands. If the agent isn't allowed, the same flow runs with a developer making the PR. Any string the client expects to edit often moves into the CMS (R16).
