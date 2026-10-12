# Runbook: branching and pull requests

**Status:** first draft for review (BD3244-18). Branch protection settings take effect after the repo move to Ad Council's GitHub (OPEN-11).

## Purpose
Make every change reviewable and traceable to a Jira ticket. Source: [TDD §9.3](../TDD.md#93-cicd-and-the-branch-model-tl-decision-for-the-branches-verified-for-ciyml-proposed-for-the-other-workflows) and [AGENTS.md](../../AGENTS.md).

## Who
Everyone who changes the repo, including the China team (after the repo move). Art reviews for technical accuracy.

## Branch model
| Branch | Purpose |
|---|---|
| `dev` | Trunk and default branch. Feature PRs target it. Deploys to dev |
| `staging` | UAT. Receives `dev` by promotion PR |
| `prod` | Live. Receives `staging` by promotion PR, or a `hotfix/*` branch |

All three are protected: a PR, green CI, 1 approving review (a tech lead for `staging` and `prod`), no force-push.

## Prerequisites
- Repo access. A Jira ticket (`BD3244-123`) with acceptance criteria.
- Local setup done ([run-locally](./run-locally.md)).

## Steps: a normal change
1. Update and branch from `dev`:
   ```sh
   git switch dev && git pull
   git switch -c feat/BD3244-123-short-description
   ```
   Use `feat/`, `fix/`, `chore/`, or `docs/` and the ticket key.
2. Make a small change. Follow the rules in [AGENTS.md](../../AGENTS.md).
3. Run what CI runs before you push:
   ```sh
   pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
   CMS_FIXTURES=1 pnpm build && pnpm e2e    # first time: pnpm --filter @llf/web exec playwright install chromium
   ```
   `pnpm format` fixes formatting.
4. Commit with a conventional prefix and the ticket:
   ```sh
   git commit -m "feat: add carousel keyboard controls (BD3244-123)"
   ```
   Prefixes: `feat:`, `fix:`, `chore:`, `docs:`.
5. Push and open a PR into `dev`:
   ```sh
   git push -u origin HEAD
   gh pr create --base dev
   ```
   Fill every section of the PR template: summary, Jira key, target branch, screenshots (desktop and mobile for UI), the definition-of-done checklist, and any OPEN-# you touched.
6. Wait for CI (`checks` and `e2e`). On dev PRs, Render posts a preview URL for the web app once BD3244-15 is done.
7. Address review comments with new commits. Don't force-push a shared branch.
8. A reviewer approves, and you merge (squash). Delete the branch.

## Steps: promote `dev` → `staging` → `prod`
1. Open a PR from `dev` into `staging` (then `staging` into `prod`). Title: `chore: promote dev to staging`.
2. List the included tickets in the body. A tech lead reviews and approves.
3. After a `prod` merge: tag the release `vYYYY.MM.DD-n` and update [`RELEASE_LOG.md`](../RELEASE_LOG.md).

## Steps: a hotfix
1. Branch from `prod`: `git switch prod && git pull && git switch -c hotfix/BD3244-123-short-description`.
2. Fix, open a PR into `prod`, and get a tech lead's approval.
3. **Merge it back into `staging` and `dev` the same day** with PRs. Don't leave the branches diverged.

## Rules that trip people up
- Never commit directly to `dev`, `staging`, or `prod`.
- `prod` only accepts `staging` or `hotfix/*`.
- No secrets, personal data, or user text in code, tests, commits, or PR text.
- A CMS schema change merges **before** the frontend PR that needs it (previews cover the web app only).

## Verification
- CI is green and the PR links the Jira ticket.
- After merge, the dev deploy succeeds (Render, after BD3244-15).

## Rollback
Revert the PR with `gh pr` / the GitHub **Revert** button into the same branch. For production problems, see [roll-back-release](./roll-back-release.md).

## Escalation
Art for review or CI problems. Danish if a ticket's scope is unclear.
