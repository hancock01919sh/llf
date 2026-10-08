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
| `AI_PROVIDER` | `mock` | `mock` \| `anthropic` \| `openai` \| `bedrock`. `anthropic` is live (`src/extract/anthropic.ts`). `openai` and `bedrock` are stubs until OPEN-1 is decided. |
| `AI_MODEL` | `mock-1` | Passed to the provider and included in the URL cache key. |
| `PROMPT_VERSION` | `p1` | System prompt version (`src/extract/prompt.ts`). Add a new version instead of editing one that an eval has scored. |
| `ANTHROPIC_API_KEY` | unset | Dev only: ddd's key, on Render dev and for `pnpm eval` (OPEN-2). Without it, `anthropic` returns `upstream_error`. Never logged. |
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
```

| Option | Meaning |
|---|---|
| `--provider`, `--model`, `--prompt` | Override `AI_PROVIDER`, `AI_MODEL`, and `PROMPT_VERSION` from `.env` |
| `--set <file>` | Labeled set. Defaults to `eval/sets/v0-synthetic.json` |
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

`<stamp>` is `<UTC time>-<provider>-<model>`, for example `2026-10-08T072620Z-anthropic-claude-x`.

**Labeled sets.** Each case has an `id` (kebab case), a `kind` (`text` with `text`, or `image` with `imagePath` relative to the set file and `mimeType`), the `detectedType`, `expectedReadable`, the `expectedSlugs` from the CMS catalog, and `injection: true` for prompt-injection cases. The schema is `src/eval/labeled-set.ts`. Images must be rights-cleared and must not show people or personal data.

**Prompts.** The prompt is versioned in `src/extract/prompt.ts` (`p1`). Once a version has been scored, don't edit it. Add `p2` and compare the two with `--prompt`.

**`v0-synthetic.json` is a harness smoke test, not the G2 gate.** It has 15 text cases. The mock adapter scores 11 of 15 and misses the bar on purpose, because it splits text on commas and new lines and treats every item as food. It fails `recipe-banana-bread` (extra "bread"), `receipt-grocery` (misses banana), `unreadable-noise` (says readable), and `injection-recipe-note` (keeps the injected items). The G2 set is 80–120 real items, then 150+ before UAT.

`openai` and `bedrock` are stubs until OPEN-1 is decided. The manual `eval.yml` workflow (TDD §9) is not built yet.

## Known behavior
- **Bot-protected recipe sites return `upstream_error` (502).** For example, Allrecipes and Simply Recipes return 403 to our user agent. Use sites that serve JSON-LD for demos and evals, such as cookieandkate.com or budgetbytes.com.
- The in-memory cache, counters, and rate limits reset on restart. Shared stores replace them on Render and AWS behind the same interfaces (`src/cache.ts`).
- `src/lambda.ts` is the Phase B entry point for API Gateway and Lambda. `src/server.ts` is the Node http entry point for local and Render.
