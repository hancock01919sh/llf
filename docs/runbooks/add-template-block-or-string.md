# Runbook: add a template, a block, or a site string

**Status:** first draft for review (BD3244-18). No Storybook is set up in the repo yet, so the "story" step below is pending the component workflow (BD3244-25).

## Purpose
Add UI to the site the way the TDD expects ([TDD §6.4](../TDD.md#64-templates-blocks-and-site-strings), D21). Pick the right one first:

| You need | Use |
|---|---|
| A new fixed page layout for a designed route | **Template** |
| A module editors can add to a page (below the Home slots or on the generic template) | **Block** |
| A label, hint, aria text, or the 404 page | **Site string** |
| Page content, tips, long text, images | **CMS** (Strapi). Not code |

Never put a user-visible string literal inline in a component.

## Who
Developers. A tech lead reviews. Copy-only requests follow [copy-changes](./copy-changes.md).

## Prerequisites
- [run-locally](./run-locally.md) works.
- A Jira ticket and the Figma frame (working copy `JZTCmehamc5QkAYw1lw5jW`). Tokens come from its Design System page and must pass the contrast rules (TDD §6.3).
- Definition of done in [AGENTS.md](../../AGENTS.md): WCAG 2.1 AA, SEO, `data-module-*` attributes, tests, mobile below 768 px and desktop from 1024 px.

## A. Add a site string
Strings live in `apps/web/content/strings.ts`, validated by a Zod schema in the same file.
1. Add the key to the `SiteStrings` schema and its value in the strings object. Keep existing keys stable. Use `{name}` placeholders for values, filled by `format()`.
2. Use it in the component through the strings object, not an inline literal.
3. Run `pnpm --filter @llf/web test` (the strings test validates the file).
4. For a copy-only change, edit values only and follow [copy-changes](./copy-changes.md).

## B. Add a block
Files: a Strapi component, a Zod schema, a React component, a story, and a registry entry.
1. **Strapi component:** add it under `apps/cms/src/components/` and allow it in the Page dynamic zone. The change must be additive ([schema-changes-and-migrations](./schema-changes-and-migrations.md)).
2. **Schema:** add the block schema to `packages/contracts/src/cms.ts`, with a test in `cms.test.ts`. Don't define API shapes anywhere else.
3. **Component:** add `apps/web/blocks/<Name>.tsx`. Use semantic headings that respect the heading level set in the CMS, keyboard support, and alt text from the CMS. Add `data-module-*` attributes (the registry's `type` becomes `data-module-type`).
4. **Registry:** add an `entry({ schema, Component, type })` to `apps/web/blocks/registry.ts` with the key `<category>.<name>` matching the Strapi component.
5. **Fixture and seed:** add an example to `apps/web/fixtures/cms/` and `scripts/seed/fixtures/` (they must stay in step), so CI and local builds exercise it.
6. **Story:** pending (see status).
7. **Tests:** a component test for each UI state, and an e2e/axe check for a page that shows it.

## C. Add a template
Files: the template, slot fields on Page, a Zod schema for the slots, a story, and a registry entry.
1. Add the template name to `PAGE_TEMPLATES` in `packages/contracts/src/cms.ts`, and the slot schema.
2. Add the Page slot fields in Strapi with **conditional visibility**, so editors only see the fields for their template.
3. Add `apps/web/templates/<Name>Template.tsx`.
4. Register it in `apps/web/templates/registry.ts`. The `satisfies` clause makes TypeScript fail if a template name has no component.
5. Add fixtures and a test in `templates.test.tsx`. Designed routes (`/`, `/find-my-tips`) use their template directly.

## Verification
```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
CMS_FIXTURES=1 pnpm build && pnpm e2e
```
Open the page locally on mobile and desktop widths, tab through it, and check it with the keyboard only.

## Rollback
Revert the PR ([branching-and-prs](./branching-and-prs.md)). CMS schema changes that already deployed stay: additive fields are harmless.

## Escalation
Art for registry, contracts, or schema questions.
