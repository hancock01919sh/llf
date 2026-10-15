# Find My Tips service

The tool API behind Find My Tips (TDD §7). It accepts a shopping list as text, a photo, or a recipe URL. It extracts ingredient names, matches them against the CMS ingredient catalog, and returns catalog slugs plus an `unmatchedCount`. It never returns model text (TDD D21).

- **Contract:** `packages/contracts/src/find-tips.ts`, with Zod schemas for the request, response, and error shapes.
- **Matching:** `packages/matching`.

## Run it
```sh
pnpm --filter @llf/find-my-tips dev     # watch mode; reads the root .env
pnpm --filter @llf/find-my-tips start   # no watch
pnpm --filter @llf/find-my-tips test
```
`CMS_FIXTURES=1 pnpm dev:fe` from the repo root starts this service and the web app together. The web app forwards `/api/*` to this service: through rewrites in `next dev` (`next.config.ts`), and through `server.mjs` in `pnpm --filter @llf/web start`. Set `TIPS_URL` to point it at a different host.

## Environment
All keys are optional and every one has a default. Empty values are treated as unset. The full list is in `src/config.ts`.

| Key | Default | Notes |
|---|---|---|
| `AI_PROVIDER` | `mock` | `mock` \| `anthropic` \| `openai` \| `gemini` \| `bedrock`. `anthropic`, `openai`, and `gemini` are live (`src/extract/anthropic.ts`, `src/extract/openai.ts`, `src/extract/gemini.ts`). `bedrock` is a stub until OPEN-1 is decided. |
| `AI_MODEL` | `mock-1` | Passed to the provider and included in the URL cache key. |
| `PROMPT_VERSION` | `p1` | System prompt version (`src/extract/prompt.ts`). Add a new version instead of editing one that an eval has scored. |
| `ANTHROPIC_API_KEY` | unset | Dev only: ddd's key, on Render dev and for `pnpm eval` (OPEN-2). Without it, `anthropic` returns `upstream_error`. Never logged. |
| `OPENAI_API_KEY` | unset | TBWA's capped test key, for Render dev, `pnpm eval`, and `pnpm arena` only (OPEN-1). Without it, `openai` returns `upstream_error`. Never logged. |
| `GEMINI_API_KEY` | unset | ddd's own key, for Render dev, `pnpm eval`, and `pnpm arena` only, with test data only (TDD D25). Without it, `gemini` returns `upstream_error`. Never logged. |
| `AI_REASONING_EFFORT` | unset | `none` \| `minimal` \| `low` \| `medium` \| `high`. Sent to OpenAI as `reasoning_effort`; mapped to a Gemini `thinkingBudget` (0 / 0 / 1024 / 8192 / 24576). Anthropic and the mock ignore it. Unset uses the model's default. |
| `FIND_TIPS_MODE` | `live` | Kill switch (TDD §7.7). `jsonld-only` makes no model calls; `off` returns 503 `unavailable`. |
| `TOOL_PORT` / `PORT` | `8787` | `TOOL_PORT` takes precedence. Render sets `PORT`. |
| `CATALOG_URL` / `CATALOG_FILE` | bundled `src/fixtures/catalog.json` | Catalog source, refreshed every `CATALOG_REFRESH_MS` (60 s). |
| `QUOTA_DAILY_MODEL_CALLS` | `3000` | Counted per input type and reset at 00:00 UTC. When a type's budget is spent, URLs fall back to JSON-LD only and text or image return 503 `unavailable`. |
| `RATE_LIMIT_*` | 30 URL / 10 model per 5 min per IP | |
| `URL_CACHE_TTL_MS` | 24 h | Caches only the extracted terms, keyed by the URL's SHA-256. |

## API
| Route | Method | Notes |
|---|---|---|
| `/api/find-tips/status` | GET, HEAD | `{ mode, catalogVersion }` |
| `/api/find-tips/extract` | POST only | Other methods return 405. Bodies over 4 MiB (`BODY_MAX_BYTES`) return 413. |

```sh
curl -s localhost:8787/api/find-tips/status

# Text: up to 5,000 characters
curl -s -X POST localhost:8787/api/find-tips/extract -H 'content-type: application/json' \
  -d '{"inputType":"text","text":"milk, eggs, spinach, bananas"}'

# Recipe URL: uses JSON-LD when the page has a Recipe, and the model otherwise
curl -s -X POST localhost:8787/api/find-tips/extract -H 'content-type: application/json' \
  -d '{"inputType":"url","url":"https://cookieandkate.com/healthy-banana-bread-recipe/"}'

# Image: base64, jpeg/png/webp, up to 3 MiB decoded
curl -s -X POST localhost:8787/api/find-tips/extract -H 'content-type: application/json' \
  -d "{\"inputType\":\"image\",\"mimeType\":\"image/jpeg\",\"imageBase64\":\"$(base64 < list.jpg)\"}"
```

The response always has the same shape:

```json
{ "requestId": "…", "detectedType": "recipe", "readable": true,
  "matches": [{ "slug": "banana", "title": "Banana", "inferred": false }],
  "unmatchedCount": 10, "source": "jsonld", "catalogVersion": "…" }
```

`source` is `jsonld`, `model`, or `cache`. Errors return `{ requestId, code }`, with the HTTP status mapped in `src/http.ts`. For example, `url_not_allowed` returns 422 and `upstream_error` returns 502.

## Rules (from AGENTS.md)
- **No user input is stored or logged (D20).** Logs are one JSON line per request with counts, codes, latency, and the URL hash, and never input text, image bytes, or URLs. Don't add a log field that carries user input.
- **Every model call goes through `src/extract`.** The adapter is chosen by `AI_PROVIDER`, and the output is validated with Zod before use. Don't call an SDK from anywhere else.
- **Recipe URLs are fetched only through `src/url/safe-fetch.ts`.** It allows http/https on ports 80 and 443, resolves DNS and blocks private ranges, pins the connection to the checked IP, and re-checks every redirect (3 max, 3 MiB, 5 s). `127.0.0.1`, metadata IPs, and similar addresses return `url_not_allowed`.

## Model eval (P9)
The eval runs a labeled set through the same extraction and matching path as the API and scores it against the G2 bar (TDD §7.9, [PROOF_DOC P9](../../docs/PROOF_DOC.md)). Run it from the repo root.

```sh
pnpm eval                 # mock adapter, synthetic set, no key, $0
pnpm eval -- -h           # all options

# Live run (needs ANTHROPIC_API_KEY in the root .env, OPEN-2)
pnpm eval -- --provider anthropic --model <model-id> \
  --price-in <usd-per-Mtok> --price-out <usd-per-Mtok> --budget 5 \
  --set eval/sets/<set>.json

# OpenAI (needs OPENAI_API_KEY, OPEN-1)
pnpm eval -- --provider openai --model <model-id> --effort minimal \
  --price-in <usd-per-Mtok> --price-out <usd-per-Mtok> --budget 2
```

| Option | Meaning |
|---|---|
| `--provider`, `--model`, `--prompt` | Override `AI_PROVIDER`, `AI_MODEL`, and `PROMPT_VERSION` from `.env` |
| `--effort <level>` | Reasoning effort for OpenAI reasoning models. Overrides `AI_REASONING_EFFORT` |
| `--set <file>` | Labeled set. Defaults to `eval/sets/v0-synthetic.json` |
| `--catalog <file>` | Catalog to score against. Defaults to `src/fixtures/catalog.json`; use `eval/catalogs/eval-v1.json` for real sets |
| `--price-in`, `--price-out` | USD per million tokens. Required for live providers so the run can report cost |
| `--budget <usd>` | Stops before the next case once spend reaches this. Keep it well under the $100/month dev cap |
| `--out <dir>` | Output root. Defaults to `eval/` |
| `--strict` | Exits 1 when the run misses the G2 bar. Use it in CI |

Files live in the repo-root `eval/` folder:

| Path | What | Git |
|---|---|---|
| `eval/sets/*.json` | Labeled sets | Tracked |
| `eval/runs/<stamp>.json` | Full per-case results | Ignored |
| `eval/reports/<stamp>.md` | Summary report: overall, by input kind, by detected type, per case | Commit the ones you cite as evidence |
| `eval/arena.example.json` | Example arena matrix | Tracked |
| `eval/runs/arena-<stamp>.json` | Full arena results, every cell and case | Ignored |
| `eval/reports/arena-<stamp>.md` | Arena scorecard | Commit the ones you cite as evidence |

`<stamp>` is `<UTC time>-<provider>-<model>`, for example `2026-10-08T072620Z-anthropic-claude-x`. A run with `--effort` adds `-<effort>`.

**Labeled sets.** Each case has an `id` (kebab case), a `kind` (`text` with `text`, or `image` with `imagePath` relative to the set file and `mimeType`), the `detectedType`, `expectedReadable`, the `expectedSlugs` from the CMS catalog, `injection: true` for prompt-injection cases, and an optional `source`. The set's `sources` map records where each source came from (`description`, `license`, `piiReviewed`); the loader rejects a case whose source is unknown or not PII-reviewed. The schema is `src/eval/labeled-set.ts`, and the guide to collecting cases is [`eval/sets/README.md`](../../eval/sets/README.md). Images must be rights-cleared and must not show people or personal data.

**Prompts.** The prompt is versioned in `src/extract/prompt.ts`. `p1` is the default; `p2` and `p3` are eval candidates. Once a version has been scored, don't edit it. Add a new version and compare them with `--prompt`.

**`v0-synthetic.json` is a harness smoke test, not the G2 gate.** It has 15 text cases. The mock adapter scores 11 of 15 and misses the bar on purpose, because it splits text on commas and new lines and treats every item as food. It fails `recipe-banana-bread` (extra "bread"), `receipt-grocery` (misses banana), `unreadable-noise` (says readable), and `injection-recipe-note` (keeps the injected items). The G2 set is 80–120 real items, then 150+ before UAT.

`bedrock` is a stub until OPEN-1 is decided. The manual `eval.yml` workflow (TDD §9) is not built yet.

### Arena (BD3244-37)
The arena runs one labeled set through every enabled cell of a provider × model × reasoning-effort matrix and writes a single scorecard, so the model choice for OPEN-1 rests on the same cases, prompt, and catalog for every candidate (TDD §7.9, D24).

```sh
pnpm arena -- --dry-run   # list the cells, which ones run, and why the rest are skipped. $0
pnpm arena                # run eval/arena.example.json. Cells without a key are skipped
pnpm arena -- --matrix eval/<matrix>.json --set eval/sets/<set>.json --budget 10
pnpm arena -- -h          # all options
```

| Option | Meaning |
|---|---|
| `--matrix <file>` | Matrix to run. Defaults to `eval/arena.example.json` |
| `--set <file>` | Labeled set. Defaults to the matrix `setPath`, then `eval/sets/v0-synthetic.json` |
| `--catalog <file>` | Catalog to score against. Defaults to `src/fixtures/catalog.json`; use `eval/catalogs/eval-v1.json` for real sets |
| `--prompt <version>` | Prompt version for every cell. Defaults to `PROMPT_VERSION` |
| `--budget <usd>` | Spend cap across all cells. Overrides the matrix `budgetUsd` |
| `--out <dir>` | Output root. Defaults to `eval/` |
| `--dry-run` | Validates the matrix and prints the plan without calling a model |

**Matrix.** `budgetUsd` caps the whole run; each cell can also set its own `budgetUsd`. `monthlyCapUsd` (default 500), `usesPerMonth` (default 25,000 and 50,000), and `callsPerUse` (default 1) drive the cost forecast. Each cell has a `provider`, `model`, optional `effort`, `pricing` (`inputPerMTok`, `outputPerMTok` in USD), `enabled`, `reference` (default `false`), and an optional `label` and `note`. The prices in the example matrix are public list prices we assumed in October 2025. [`eval/arena-v1.json`](../../eval/arena-v1.json) uses official list prices from Oct 13, 2026. Check them before citing a scorecard.

**Scorecard.** One row per cell: cases, precision, recall, not-food rejected, injection pass rate, p50 and p95 latency, measured cost per call, cost per month at each volume, whether a 12-month forecast stays within `monthlyCapUsd`, and whether the cell meets the G2 bar. Cells that hit their budget are listed under "Stopped at the cap" and are not comparable. If we add a guardrail pre-call, set `callsPerUse` to 2.

**Reference cell.** Mark one cell `"reference": true` (for example Claude Opus 5.5) to use it as a quality yardstick rather than a candidate. It runs whatever it costs. The report then adds **What the budget buys**: every candidate (not the mock) sorted by cost, with precision, recall, and not-food rejection next to the reference, plus each one's gap in percentage points and monthly cost. It names the best in-budget pick (highest F1 within the cap) and adds **What it misses out on**: correct ingredients the reference found and the pick missed, wrong ingredients the pick added, non-food images it accepted, failed calls, the reverse direction, and the five cases with the largest gaps. Only catalog slugs and case IDs appear, never model text.

**Skipped cells.** A cell is skipped, not failed, when its key is missing (`anthropic` needs `ANTHROPIC_API_KEY`, OPEN-2; `openai` needs `OPENAI_API_KEY`, OPEN-1; `gemini` needs `GEMINI_API_KEY`, D25), when its provider is the `bedrock` stub, or when the cell is `enabled: false` (add a `note` saying why).

### Soak test (BD3244-37)
Checks error rates and limits at launch volume (25K–50K uses/month, spiky PSA bursts) without the arena's parallel load confounding the result. Images come from the labeled set (readable image cases, cycled).

```sh
pnpm soak -- --provider gemini --model gemini-3.8-flash --effort none --prompt p3 --preset smoke --budget 0.05
pnpm soak -- --preset launch --retries 2 --input-per-mtok 0.75 --output-per-mtok 3.75 --budget 5
pnpm soak -- --plan eval/my-plan.json --dry-run   # stages: {name, concurrency, calls} or {name, ratePerSec, durationSec}
```

Presets: `smoke` (4 calls) and `launch` (steady 0.05/s, peak 0.5/s, then bursts of 8, 16 and 32 concurrent calls). `--retries <n>` adds eval-only retries on 429/500/502/503/504 with jittered exponential backoff (`--retry-base-ms`), to show what a retry policy would buy; production has none. Writes `runs/soak-<stamp>.json` (git-ignored) and `reports/soak-<stamp>.md` with first-attempt and final error rates, latency, throughput, and cost per stage. No image bytes or model output are stored. `--budget` stops new calls once spend reaches the cap.

## Known behavior
- **Bot-protected recipe sites return `source_unavailable` (424).** For example, Allrecipes and Simply Recipes return 403 to our user agent. Origin 401/403/429/451, a `cf-mitigated: challenge` header, or a small 200/503 page with a known challenge marker (Cloudflare, Imperva, DataDome, PerimeterX, Akamai) counts as blocked (`src/url/blocked.ts`). The web client shows "Site blocked" copy and never retries. Other failures stay `upstream_error` (502) or `timeout` (504). Use sites that serve JSON-LD for demos and evals, such as cookieandkate.com or budgetbytes.com.
- The in-memory cache, counters, and rate limits reset on restart. Shared stores replace them on Render and AWS behind the same interfaces (`src/cache.ts`).
- `src/lambda.ts` is the Phase B entry point for API Gateway and Lambda. `src/server.ts` is the Node http entry point for local and Render.
