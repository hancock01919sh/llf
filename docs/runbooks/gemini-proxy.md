# Runbook: the Gemini proxy (dev only)

## Purpose
Google's API can't be reached from mainland China. The **Gemini proxy** is a small service on ddd's Render account in the US. It calls Gemini for you and returns the result (TDD D39, BD3244-121). One URL and one personal token cover both kinds of local work:

| You're working on | Use | What you get back |
|---|---|---|
| **The site** (tool page, results, error states) | `pnpm dev:fe:remote` | The **full Find My Tips API**: catalog matches, `unmatchedCount`, `gaps`, the same JSON the site gets in production |
| **The tool** (`services/find-my-tips`, your own branch) | `pnpm dev` with `AI_PROVIDER=gemini` | Your local tool runs your code; only its Gemini call goes through the proxy |

**Dev only, test inputs only.** No real receipts, names, or personal photos. Staging and prod never use it: they call Gemini on Ad Council's Vertex AI from AWS (D36, D37).

The proxy always uses the arena's pick: **Gemini 3.8 Flash, prompt `p3`, thinking off** ([model audit](../eval/arena/model-audit-2026-10.md)).

## Setup (2 lines, once)
Art sends you a **personal token** through a secure share (never Jira, Teams, Slack, or a PR). Add to your git-ignored root `.env`:

```sh
GEMINI_PROXY_URL=https://llf-gemini-relay-dev.onrender.com
GEMINI_PROXY_TOKEN=<your personal token>
```

Leave `GEMINI_API_KEY` empty. Check that it works:

```sh
pnpm proxy:check
```

It prints `ok` for health, your token, and one live extraction, or what failed and why.

- **Site work:** `pnpm dev:fe:remote`. The web app runs locally; `/api/*` goes to the proxy.
- **Tool work:** set `AI_PROVIDER=gemini` in `.env` and run `pnpm dev` (or `pnpm dev:fe`). Your local tool sends its Gemini calls to the proxy, which swaps your token for the real key.

**If you set this up with the old relay** (`GEMINI_BASE_URL` + `GEMINI_API_KEY=<token>`), it still works unchanged. The same token works for both.

The handover doc is also served at `GET <proxy URL>/docs`.

## Auth
Every route except `/healthz` and `/docs` needs your token, in either header:

```
Authorization: Bearer <token>
x-goog-api-key: <token>          # what the Gemini adapter sends
```

A missing, wrong, or revoked token returns `401 {"error":{"code":401,"message":"invalid proxy token"}}`.

## Endpoints

### `GET /healthz`
No auth. `200 ok` when the service is up.

### `GET /api/find-tips/status`
```json
{ "mode": "live", "catalogVersion": "d6b0257e63c4" }
```
`mode` is `live`, `jsonld-only`, or `off` (the kill switch, TDD §7.7).

### `POST /api/find-tips/extract`
`Content-Type: application/json`. Exactly one input type (`packages/contracts/src/find-tips.ts`, `ExtractRequest`):

```jsonc
{ "inputType": "text",  "text": "milk, eggs, spinach" }                   // 1–5000 chars
{ "inputType": "url",   "url": "https://example.com/recipe" }             // ≤ 2048 chars
{ "inputType": "image", "imageBase64": "<base64>", "mimeType": "image/jpeg" } // jpeg | png | webp, ≤ 4 MB body
```

`200` (`ExtractResponse`):
```json
{
  "requestId": "4cba5a96-…",
  "detectedType": "shopping_list",
  "readable": true,
  "matches": [
    { "slug": "milk", "title": "Milk", "inferred": false },
    { "slug": "spinach", "title": "Spinach", "inferred": false }
  ],
  "unmatchedCount": 1,
  "gaps": [],
  "source": "model",
  "catalogVersion": "d6b0257e63c4"
}
```
- `detectedType`: `recipe`, `receipt`, `shopping_list`, `dish`, `fridge_photo`, `unknown`.
- `matches[].title` comes from the CMS catalog, never from the model. `inferred: true` means "likely" (a dish photo implies it).
- `unmatchedCount` is a **count only**; never show raw model output (AGENTS.md).
- `gaps` is empty unless `GAP_LOG=on` (D35).
- `source`: `model`, `jsonld` (read from the recipe page, no model call), or `cache`.

### `POST /v1beta/models/{model}:generateContent`
The relay, for a locally run tool. The body and response are Google's own `generateContent` format, unchanged. You normally don't call this yourself: the Gemini adapter does when `GEMINI_PROXY_URL` (or `GEMINI_BASE_URL`) points here. Only `gemini-3.8-flash` is allowed.

## Error states
**Find My Tips errors** (`/api/find-tips/*`) are `{"requestId": "…", "code": "<code>"}`. There's no message on purpose: the UI maps each `code` to Tool Copy from the CMS (BD3244-103).

| HTTP | `code` | When | UI copy group (BD3244-88) |
|---|---|---|---|
| 400 | `invalid_request` | Bad JSON, wrong `inputType`, empty or too-long text | Fix it |
| 413 | `too_large` | Body over 4 MB, or an image too large | Fix it |
| 415 | `unsupported_media_type` | Image isn't JPEG, PNG, or WebP | Fix it |
| 422 | `url_not_allowed` | URL not http(s), private address, or blocked site | Fix it |
| 424 | `source_unavailable` | The recipe site blocked or failed the fetch | Fix it (paste or photo) |
| 429 | `rate_limited` | Too many requests from your IP; see `Retry-After` | Try again (wait) |
| 502 | `upstream_error` | Gemini returned an error or unusable output | Try again |
| 503 | `unavailable` | Tool switched off, or the daily model quota is used | Try again later |
| 504 | `timeout` | Gemini or the recipe site took too long | Try again |
| 404 | `not_found` | Unknown `/api/find-tips/…` path | (bug) |
| 405 | `method_not_allowed` | Wrong method; see `Allow` | (bug) |
| 500 | `server` | Anything unexpected | Try again |

`readable: false`, `detectedType: "unknown"`, or zero matches are **not errors** (`200`): show "Tips anyway".

**Proxy errors** are `{"error": {"code": <http>, "message": "…"}}`:

| HTTP | Message | When |
|---|---|---|
| 401 | `invalid proxy token` | Missing, wrong, or revoked token |
| 403 | `model not allowed` | Relay: a model other than `gemini-3.8-flash` |
| 404 | `not found` | Any other path |
| 413 | `request too large` | Relay body over 6 MB |
| 429 | `daily relay quota used` | Relay: the shared daily cap; resets at 00:00 UTC |
| 502 / 504 | `upstream failed` / `upstream timed out` | Relay: Google unreachable or slow |

## For Art: tokens, deploys, logs
- **Issue a token:** `openssl rand -hex 24`, append it to `RELAY_TOKENS` on `llf-gemini-relay-dev` (comma-separated), save. Note whose token is in which position: logs show only the position (`caller`). Send it through a secure share.
- **Revoke:** remove it from `RELAY_TOKENS` and save. Other tokens keep working.
- **Limits:** the tool's daily quota and model settings come from the `llf-dev-tool` env group; the relay's model allow-list and daily cap are `RELAY_MODELS` and `RELAY_DAILY_CALLS`.
- **Deploy:** automatic with Deploy dev, or by hand (`node scripts/render-deploy.mjs`, or Manual Deploy in Render) while GitHub Actions is off.
- **Logs** (Render → Logs): JSON lines with route, status, caller position, model, and latency. No bodies, tokens, or keys (D20).
- **Run it locally:** `pnpm dev:proxy` with the real `GEMINI_API_KEY` and `RELAY_TOKENS` in `.env` (port 8790).
