# Runbook: handle a copy-change request

**Status:** first draft for review (BD3244-18). Whether the Copilot coding agent and its Jira integration are allowed in Ad Council's GitHub and Jira, and who files requests after handoff, is OPEN-32. The agent flow is pending spike P13.

## Purpose
Change a short **site string** (a label, hint, aria text, or the 404 page) that lives in code, safely and with a record ([TDD §5.2](../TDD.md#52-proposed-v1-schema-proposed), D21). CMS content isn't handled here: editors change that in Strapi and publish.

## When to use it
- Someone asks for different button text, a form hint, aria text, or the 404 copy.

If the text is page content, a tip, Tool Copy, long-form text, or an image, tell the requester to edit it in the CMS.

## Who
- **Requester:** anyone on the team, and client editors after handoff if OPEN-32 allows it.
- **Reviewer:** a ddd tech lead (after handoff, whoever owns the repo, OPEN-11).

## Prerequisites
- The GitHub issue form `.github/ISSUE_TEMPLATE/copy-change.yml` (the "Copy change" form, label `copy-change`).
- The strings file `apps/web/content/strings.ts`.

## Steps
1. **The requester files a "Copy change" issue** from the form. They give the page, the current text (exactly as it appears), the new text, an optional reason and Jira key, and confirm it's a site string only. They must not paste secrets, personal data, or anything a visitor typed.
2. **The reviewer checks scope.** It must be a change to `apps/web/content/` only. If it also needs a layout change or a CMS change, convert it to a normal ticket.
3. **A change is made**, in one of two ways:
   - **Copilot coding agent** (if allowed, OPEN-32): the reviewer assigns the issue to the agent. It opens a draft PR that edits only `apps/web/content/`. Check the PR for this.
   - **A developer**: make the same small PR by hand ([branching-and-prs](./branching-and-prs.md)). Branch `chore/copy-<short-description>`, target `dev`.
4. **Keep the change tight.** Change only the strings asked for. Keep the keys stable. Keep `{name}` placeholders. Link the issue in the PR (`Closes #123`).
5. **Run the checks** (CI does it too):
   ```sh
   pnpm --filter @llf/web test
   pnpm format:check && pnpm lint && pnpm typecheck
   ```
6. **Review the preview.** Check the PR's Render preview link (after BD3244-15) or run it locally with `CMS_FIXTURES=1 pnpm dev:fe`. Check the text fits on mobile and desktop and reads correctly with a screen reader label if it's aria text.
7. **Merge to `dev`**, then promote to `staging` and `prod` like any change ([branching-and-prs](./branching-and-prs.md)). Tell the requester when it's live.

## Verification
- The new text shows on the page in the target environment.
- The diff touches only `apps/web/content/`.
- CI is green. The issue is closed.

## Rollback
Revert the PR. Strings have no data, so a revert is safe.

## Escalation
Art if the request needs more than strings, or if the agent opens a PR that touches other files.
