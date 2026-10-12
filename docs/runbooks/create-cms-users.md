# Runbook: create CMS users

**Status:** first draft for review (BD3244-18). Role names come from [TDD §5.2](../TDD.md#52-proposed-v1-schema-proposed) and §5.4, and must be matched to what exists in Strapi when the roles are configured. Deployed environments are pending BD3244-15 and BD3244-6.

## Purpose
Give someone access to the Strapi admin with the right role, and remove access when it's no longer needed.

## Roles
| Role | Who | Can do |
|---|---|---|
| Super Admin | ddd tech leads. China team leads on cms-dev (so they can add users). The client's super-admin after handoff (OPEN-11) | Everything, including users and settings |
| Editor | Ad Council content people. China team on cms-dev | Create and publish content |
| Author | Only if the coalition needs it | Create, not publish |

Strapi has **no built-in 2FA**, and SSO is a paid feature ([TDD §5.6](../TDD.md#56-strapi-plan-and-editorial-features-verified-vendor-docs-oct-2026)). The IP allow-list is the main protection, so every user also needs an allow-listed IP ([cms-ip-allow-list](./cms-ip-allow-list.md)).

## Who
A Super Admin. Ask in a Jira ticket with the person's name, work email, role, and environment. Ad Council confirms editors.

## Prerequisites
- Super Admin access to the CMS for the environment, from an allow-listed IP.
- A password manager. Passwords are strong and unique. Never send a password in chat.

## Steps

### Deployed environments (the normal way)
1. Open the admin → **Settings → Administration Panel → Users → Invite new user**.
2. Enter name and email, choose the role, and send the invite. The person sets their own password through the link.
3. Ask them to confirm they can log in from their allow-listed network.
4. Record the user and role in the Jira ticket (no passwords).

### Local only
For your own laptop, use the CLI (run from the repo root, with the CMS database running):
```sh
pnpm --filter @llf/cms strapi admin:create-user \
  --firstname=Local --lastname=Admin --email=you@example.com --password=<local-only-password>
```
Other commands: `admin:list-users`, `admin:reset-user-password`, `admin:block-user`, `admin:delete-user`. Use them on a deployed environment only with a tech lead's approval and through a secure shell, because arguments land in shell history.

## Removing a user
1. In **Users**, delete the user, or block them if their content ownership matters.
2. Remove their IP from the allow-list.
3. If they had a Strapi API token or a Render or AWS login, follow [rotate-secrets](./rotate-secrets.md) (someone leaves).

## Verification
- The new user logs in and sees only what their role allows.
- A removed user can't log in.

## Rollback
Delete the user. If a role was wrong, change it under **Users → Edit**.

## Escalation
Tech lead → James Steele for access problems. Ad Council IT for editors.
