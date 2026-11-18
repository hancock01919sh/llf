# Runbooks

Step-by-step procedures for running, changing, and handing over Long Live Food. They're written for people who can't ask a question in real time (time zones, language), so each one is short, numbered, and copyable.

**Owner:** James Calhoun (BD3244-18). **Technical review:** Art Longbottom. **Status:** first draft. Procedures that depend on Render (BD3244-15), AWS (BD3244-6, OPEN-3), or an open question are marked `Pending` or `TODO(OPEN-#)`. Commands that exist in the repo today are verified. Placeholders in `<angle brackets>` are filled in when the infrastructure exists.

Every runbook has: purpose, when to use it, who, prerequisites, steps, verification, rollback, and escalation.

**Never put a secret value in a runbook, Jira, Slack, or a PR.** Runbooks name secrets only ([AGENTS.md](../../AGENTS.md)).

## Operations (TDD §9.6)
| Runbook | Use it when |
|---|---|
| [publish-fails](./publish-fails.md) | A CMS publish doesn't reach the site |
| [roll-back-release](./roll-back-release.md) | A release is bad and you must switch back (release pointer, Render rollback, DNS) |
| [tool-kill-switch](./tool-kill-switch.md) | Turn Find My Tips off or to JSON-LD only. Includes a spend-cap breach |
| [rotate-secrets](./rotate-secrets.md) | Scheduled rotation, someone leaves, or a leak |
| [swap-ai-provider](./swap-ai-provider.md) | Change `AI_PROVIDER`, `AI_MODEL`, or the prompt version |
| [vertex-gemini](./vertex-gemini.md) | Gemini on Ad Council's Vertex AI: project, service accounts, and WIF for staging and prod (D37) |
| [restore-cms](./restore-cms.md) | Restore the CMS from a snapshot or export |
| [cms-ip-allow-list](./cms-ip-allow-list.md) | Add or remove an IP for the CMS admin |
| [strapi-patch-upgrade](./strapi-patch-upgrade.md) | Monthly Strapi patch upgrade |
| [transfer-content](./transfer-content.md) | Move content between environments (`strapi transfer`) |
| [render-dev](./render-dev.md) | Set up the Render dev environment, deploy it, or point it at cms-dev |
| [gemini-proxy](./gemini-proxy.md) | Use the dev Gemini proxy from mainland China; its endpoints and error states; issue or revoke tokens |
| [aws-containers](./aws-containers.md) | Build and run the web, tool, and CMS images for AWS Fargate, and their runtime env |
| [render-shutdown](./render-shutdown.md) | Close out Phase A after hypercare |

## Process docs (TDD §11.4)
| Runbook | Use it when |
|---|---|
| [run-locally](./run-locally.md) | Setting up and running the stack on your machine |
| [branching-and-prs](./branching-and-prs.md) | Opening a PR, promoting, or shipping a hotfix |
| [add-template-block-or-string](./add-template-block-or-string.md) | Adding a template, a block, or a site string |
| [schema-changes-and-migrations](./schema-changes-and-migrations.md) | Changing the Strapi content model |
| [seeding](./seeding.md) | Loading the synthetic fixtures into a CMS |
| [create-cms-users](./create-cms-users.md) | Adding or removing CMS admin users |
| [read-logs](./read-logs.md) | Finding out what a service did |
| [copy-changes](./copy-changes.md) | Handling a "Copy change" request for a site string |

## Related docs
- [`TDD.md`](../TDD.md): the design these runbooks follow
- [`LAUNCH_CHECKLIST.md`](../LAUNCH_CHECKLIST.md): go/no-go and the cutover runbook (Jan 8)
- [`RELEASE_LOG.md`](../RELEASE_LOG.md): releases and incidents
- [`CLIENT_AUDIT.md`](../CLIENT_AUDIT.md): access, accounts, and owners
- [`PROOF_DOC.md`](../PROOF_DOC.md): spikes that finish some of the pending steps (P7, P13, and the admin IP spike)

## Keeping them current
`docs/runbooks/` must be current before launch ([`LAUNCH_CHECKLIST.md`](../LAUNCH_CHECKLIST.md) §1, Handoff). When infrastructure lands, replace `Pending` markers and placeholders with real names and rerun each procedure once on a non-production environment.
