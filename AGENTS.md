# AGENTS.md

Instructions for AI coding agents (Copilot, Cursor, Claude, and others) and for the humans who review their work.

## Read these first
1. [`docs/PROJECT.md`](docs/PROJECT.md): client, scope, people, and brand rules.
2. [`docs/TDD.md`](docs/TDD.md): the architecture, contracts, and decisions we build against. Statements are labeled **[CONFIRMED]**, **[TL DECISION]**, **[VERIFIED]**, **[PROPOSED]**, or **[OPEN]**. **[TL DECISION]** items are binding for the build.
3. Companion docs: [`CLIENT_AUDIT.md`](docs/CLIENT_AUDIT.md) (access and inherited assets), [`PROOF_DOC.md`](docs/PROOF_DOC.md) (spikes), [`RELEASE_LOG.md`](docs/RELEASE_LOG.md) (releases and feedback), [`LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) (go/no-go).

If a task touches anything marked **[OPEN]**, don't guess. Leave a `// TODO(OPEN-#): …` comment that points to the open-question number in [TDD §15](docs/TDD.md#15-open-questions), and mention it in the PR.

## Hard rules
- **Figma is the source of truth for the UI**, specifically the copy in the TBWA Worldwide org, not the MullenLowe original (TDD §6.1, OPEN-33). TBWA's prototype code is reference only.
- **Never show AI-generated text to users.** Everything users read comes from Strapi or from the typed site strings in `apps/web/content/` (TDD D21). The model only returns structured data (ingredient names), and code matches that data against the CMS catalog. Show unmatched items as a **count**, never as raw model output.
- **The AI provider must be swappable.** Every model call goes through `extractIngredients(input, ctx): Promise<ExtractionResult>` and a provider adapter (`mock`, `anthropic`, `openai`, `bedrock`). Choose the provider and model with env config (`AI_PROVIDER`, `AI_MODEL`), never with code changes.
- **Use the mock adapter by default.** Local dev and CI run with `AI_PROVIDER=mock` and recorded fixtures. Live keys (ddd's Anthropic dev key, TBWA's capped OpenAI test key) are used only on Render dev and in the manually triggered `eval` suite.
- **Validate model output with Zod** before using it. Use the provider's strict JSON-schema / tool mode.
- **Don't store user input.** Uploaded images and typed text are processed in memory and never persisted or logged (TDD D20). For recipe URLs, only a hash of the URL and the terms extracted from the public page are cached.
- **Recipe URL fetching is an SSRF risk.** Always use the shared `safeFetch` helper (http/https on 80/443 only, DNS resolved and private ranges blocked, limited redirects, size, and time).
- **Don't add new third-party services** without raising it in the TDD first. That includes SaaS, npm packages that call outside services, and browser scripts. Ad Council IT has to approve each one. Approved: GitHub, AWS, Strapi, OpenAI. Dev-only, pending acceptance: **Render** and **Anthropic** on ddd's accounts. **Production never runs on Render.**
- **Never commit secrets.** Locally use git-ignored `.env` files and keep `.env.example` current (keys only, no values). Render uses env groups; AWS uses Secrets Manager / SSM. **Never paste secrets into Jira, Slack, PRs, or docs.**
- **Postgres everywhere.** Docker Compose locally, Render Postgres, then RDS. Never SQLite.
- **The CMS admin is never public.** It's on its own domain behind an IP allow-list. The Strapi Public role has no permissions; the site reads content with an API token at build time.
- **Analytics carry no personal data or user text.** No search terms, no ingredient text, no URLs users submit. Event names and params are typed in `packages/contracts/analytics.ts` (TDD §8). `page_location` is always the sanitized URL (allow-listed params only).
- **User text never goes in a URL path or query string.** Site search keeps the term in the fragment (`/search/#q=`); tool input is POSTed. Query strings end up in CDN and WAF logs (TDD §6.1, §7.6).

## Definition of done (every component and feature)
- **Accessibility: WCAG 2.1 AA.** shadcn/Radix primitives are a starting point, not proof of compliance. Use semantic headings that respect the heading level chosen in the CMS. Everything must work from the keyboard, focus must be managed in modals and carousels, alt text comes from the CMS, contrast must pass, and `prefers-reduced-motion` must be respected (TDD §6.6).
- **SEO:** metadata comes from the CMS `seo` component, with a canonical URL and the right JSON-LD (TDD §6.7).
- **Analytics:** modules carry `data-module-*` attributes so the generic `module_view` and `cta_click` events work without per-module code (TDD §8).
- **Content in the right place (TDD D21):** content, Tool Copy, long-form rich text, and images come from the CMS. Short UI strings come from `apps/web/content/`. Never put a user-visible string literal inline in a component.
- **Tested:** unit tests for logic, component tests for UI states, and Playwright with axe for pages. Performance budgets from TDD §6.8.
- **Responsive** at the breakpoints in the Figma designs.

## Where content lives (TDD D21, §6.4)
| Kind | Lives in | To add one |
|---|---|---|
| **Collections, Global, Tool Copy, rich text, asset slots** (hero images, intros, featured items) | Strapi | Schema change in `apps/cms` (additive, TDD §5.2) + Zod schema in `packages/contracts` |
| **Template** (fixed layout for a designed route) | `apps/web/templates/` | The template, its slot fields on Page (conditional visibility), a Zod schema for the slots, a story, and a registry entry |
| **Block** (dynamic zone, generic Page template only) | Strapi component + `apps/web/blocks/` | A Strapi component, a Zod schema, a React component, a story, and a registry entry |
| **Site string** (labels, hints, aria text, the 404 page) | `apps/web/content/*.ts` (typed, Zod-validated) | Edit the file and use the key. No CMS change |

**Copy-change requests** (TDD §5.2): a "Copy change" issue (or Jira ticket) → assigned to the Copilot coding agent → a draft PR that edits only `apps/web/content/` → CI and a Render PR preview → human review → merge to `dev`. When you handle one, change only the strings asked for, keep the keys stable, and link the issue in the PR.

## Conventions
- **Stack:** Next.js (App Router) + **Tailwind CSS v4 + shadcn/ui** (components copied into `packages/ui`, tokens from Figma). Strapi 5 in `apps/cms` (the inherited JS project). TypeScript everywhere else.
- **Toolchain:** Node 22 LTS and pnpm workspaces. The repo layout is in TDD §4.4.
- Shared types and Zod schemas live in `packages/contracts`. Don't redefine API shapes anywhere else.
- Strapi schema changes must be backward compatible (two-phase for relation changes, TDD §5.2). Explain any breaking change in the PR description.
- **Branches:** `dev` (trunk, deploys to dev) → `staging` (UAT) → `prod` (live). Feature PRs target `dev`. Promotion is by PR. Hotfixes branch from `prod` and are merged back into `staging` and `dev` (TDD §9.3).
- Use small PRs that reference a Jira ticket (`LLF-123`), with conventional commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`).
- **Keep the docs current:** a design change updates the TDD and its decision log (§14) in the same PR; spike results go in `PROOF_DOC.md`; releases go in `RELEASE_LOG.md`.
