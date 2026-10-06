## Summary
<!-- What does this PR change, and why? -->

**Jira:** <!-- e.g. LLF-123 -->

**Target branch:** <!-- Feature PRs target `dev`. `staging` and `prod` only take promotion PRs or `hotfix/*` (TDD §9.3). -->

## Screenshots / recordings
<!-- Required for UI changes: desktop and mobile. Link the Figma frame. -->

## Definition of done
- [ ] Matches the Figma frame. Any deviation is noted above.
- [ ] Accessibility (WCAG 2.1 AA): keyboard, focus, headings, alt text, contrast, and reduced motion all checked. Axe passes.
- [ ] SEO: metadata, canonical URL, and JSON-LD where they apply.
- [ ] Analytics: `data-module-*` attributes and dataLayer events are present (typed in `packages/contracts`), with no personal data, search terms, or user text.
- [ ] User-visible copy is editable in the CMS (nothing hard-coded).
- [ ] Tests are added or updated. All model calls are mocked. Prompt, schema, model, or matcher changes include an eval summary.
- [ ] No secrets in code, config, or fixtures. `.env.example` is updated if needed.
- [ ] No new third-party services, scripts, or calling packages. If you added one, flag it for Ad Council IT approval here.
- [ ] Any Strapi schema change is additive and backward compatible, or the migration is explained.
- [ ] Docs updated: TDD and decision log for design changes, `PROOF_DOC.md` for spike results.

## Open questions touched
<!-- List any TDD open-question numbers (OPEN-#) this PR depends on or works around. -->
