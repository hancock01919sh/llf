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
- Mainland China: GitHub, npm, and Docker Hub can be slow. Registry mirrors and VPN are being agreed (TDD §11.4, BD3244-19). The live AI API works only through the VPN; everything else runs on the mock.

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
PROMPT_VERSION=p3
GEMINI_API_KEY=<ddd's dev key, from the secure share>
```
This calls ddd's capped dev key on the Gemini API, the same setup as Render dev. Use **test inputs only**: no real receipts, names, or personal photos. Staging and prod use Gemini on Vertex AI in Ad Council's project without any key (TDD D37); you don't need that locally.

Restart `pnpm dev`. From mainland China, turn on the VPN first: without it Google rejects the call and the tool returns `upstream_error`. Tests and CI always use mock, so never point a test at the live key.

The dev key has a small daily budget shared by the whole team. Switch back to `AI_PROVIDER=mock` when you aren't working on the model path.

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
