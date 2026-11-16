# Runbook: run the stack locally

**Status:** first draft for review (BD3244-18). Based on the [README Quickstart](../../README.md), which is the source of truth if they differ.

## Purpose
Get the web app, Find My Tips, and (optionally) the CMS running on your machine with **no Render, AWS, or AI credentials**. It covers about 95% of the work.

## Who
Every developer, including the China team.

## Prerequisites
- **Node 22** (`nvm use` reads `.nvmrc`) and **pnpm 9** (`corepack enable`).
- **Docker**, only for the CMS (Postgres 16).
- Git access to the repo.
- Mainland China: GitHub, npm, and Docker Hub can be slow. Registry mirrors and VPN are being agreed (TDD §11.4, BD3244-19). Google's API isn't reachable from China, so a Google key doesn't work there: use the mock, or one of the two dev-only routes in [From mainland China](#from-mainland-china-dev-only-tdd-d38).

## Steps
1. Install:
   ```sh
   cp .env.example .env
   pnpm install
   ```
   `.env` is git-ignored. Never commit it, and never paste a key into it that you wouldn't want on your laptop.
2. Start with the lightest option: web and the tool, content from fixtures. No Docker, no Strapi:
   ```sh
   CMS_FIXTURES=1 pnpm dev:fe
   ```
   Web: <http://localhost:3000>. Tool: <http://localhost:8787>. Put `CMS_FIXTURES=1` in `.env` to make this the default.
3. For the CMS, start the full stack:
   ```sh
   pnpm dev
   ```
   This runs Postgres (Docker), then Strapi (<http://localhost:1337/admin>), web, and the tool. On first run it creates `apps/cms/.env` with random local-only secrets. For the CMS alone, run `pnpm dev:cms`.
4. Create your local admin user the first time you open <http://localhost:1337/admin>, or from the shell ([create-cms-users](./create-cms-users.md)).
5. Load sample content ([seeding](./seeding.md)).
6. When you finish, stop with Ctrl-C. Stop Postgres with `pnpm db:down` (data stays in the Docker volume).

## The AI provider
The tool runs on `AI_PROVIDER=mock` by default: recorded fixtures, no network.

To use a real model locally (TDD D33), add these to your git-ignored `.env`. Art sends the key through a secure share; never paste it into Jira, Slack, a PR, or chat:
```sh
AI_PROVIDER=gemini
AI_MODEL=gemini-3.8-flash
GEMINI_API_KEY=<from the secure share>
```
Restart `pnpm dev`. From mainland China this doesn't work: see below. Tests and CI always use mock.

### From mainland China (dev only, TDD D38)
Google's API is blocked from mainland China. Use one of these instead of a Google key. Both are **dev only** and use **test inputs only**: no real receipts, names, or personal photos.

**A. Front-end work: use the tool on Render dev.** No model key on your laptop. Add to `.env`:
```sh
REMOTE_API_URL=https://llf-web-dev.onrender.com
REMOTE_API_AUTH=<dev site user:pass, from the secure share>
```
Run `pnpm dev:fe:remote` instead of `pnpm dev:fe`. The web app runs locally and `/api/*` goes to the tool on Render dev, which runs the code on `dev` (not your branch).

**B. Tool work (`services/find-my-tips`): use the Gemini relay.** Your local tool calls Gemini through ddd's relay on Render, so it runs your branch's code. Art sends you a **personal relay token** through a secure share. Add to `.env`:
```sh
AI_PROVIDER=gemini
AI_MODEL=gemini-3.8-flash
GEMINI_BASE_URL=https://llf-gemini-relay-dev.onrender.com
GEMINI_API_KEY=<your relay token, not a Google key>
```
Restart `pnpm dev`. The relay allows `gemini-3.8-flash` only and has a shared daily cap. A `401` means the token is wrong or revoked; `429` means today's cap is used up (it resets at 00:00 UTC). Ask Art for a new token if yours leaks.

To try the tool:
```sh
curl -s -X POST localhost:8787/api/find-tips/extract -H 'content-type: application/json' \
  -d '{"inputType":"text","text":"milk, eggs, spinach, bananas"}'
```

## Common problems
| Symptom | Fix |
|---|---|
| Port 5432 already in use (Homebrew Postgres) | Set `POSTGRES_PORT=5433` in `.env`, delete `apps/cms/.env`, and rerun `pnpm dev:cms` |
| Web build fails with a missing `CMS_URL` or `CMS_TOKEN` | Set `CMS_FIXTURES=1`, or create a **read-only** API token in Strapi (Settings → API Tokens) and set `CMS_TOKEN` |
| Port 3000, 8787, or 1337 busy | Stop the other process. Set `TOOL_PORT` for the tool. Don't set `PORT` in `.env` |
| `pnpm` is the wrong version | `corepack enable`, then rerun |
| Playwright can't find a browser | `pnpm --filter @llf/web exec playwright install chromium` |
| Strapi won't start after a Docker reset | `pnpm db:up`, then rerun. Check `docker compose ps` |

## Checks
```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
CMS_FIXTURES=1 pnpm build && pnpm e2e
```

## Verification
- <http://localhost:3000> loads and the Find My Tips page returns results for the sample text above.
- `curl -s localhost:8787/api/find-tips/status` returns `{ mode, catalogVersion }`.

## Rollback
Local only. To reset the CMS database: `pnpm db:down`, then `docker volume ls` to find the project's `pgdata` volume, remove it, and run `pnpm dev:cms` again. This deletes your local content.

## Escalation
Ask in the team channel with your OS, Node version (`node -v`), and the exact error. Art answers setup questions.
