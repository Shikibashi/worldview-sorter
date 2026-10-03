# Evidence-guided tradition exploration

Base: `f73dc20b1a94e4609394db6b1be2ecd7bdcf94ed` (main after PR #38).

## Intent and constraints

Apply the October 2 12Axes interaction ideas without importing its matching model: explicit searchable post-result selection and conditional additional questioning. Current Worldview-Sorter already has pairwise doctrine comparison and a reviewed domain clarification planner. Extend those affordances, not the inference engine.

Only the public catalog in the completed administration's summary is searchable. Do not promote internal reference profiles or the separate Mill design. Preserve all active and historical model, bank, route, catalog, and source files. Preserve no-identity/no-percentage semantics and the source-qualification layer. A partial or unmapped doctrine is not made answerable by adding a button.

## Implementation

1. Add a read-only UI projection and synthetic tests in `apps/quiz-react/src/tradition-explorer.js` and `scripts/test-quiz-tradition-explorer.mjs`. Keep exact criterion-to-proposition and criterion-to-source links; retain separate duplicate mappings. Test missing, partial, mixed, unreviewed, and internal-only cases.
2. Add a production-artifact browser regression before connecting the UI. Check explicit selection, stale-state clearing, public-only catalog, zero answer mutation, accessible mobile reflow, and an actual optional continuation through the existing planner.
3. Add `TraditionExplorer.jsx` to the existing results comparison section. Reuse the existing evidence renderer. Search is not a ranking; no initial match is selected. Offer only reviewed direct evidence-gap domains, and only activate continuation when the existing planner has returned a positive budget. State that a domain follow-up need not settle every doctrinal gap.
4. Run helper tests, the full repository suite, production build/verification, and browser checks on the final branch. Review the complete diff. Open a PR rather than merging or deploying without a separate instruction.

## Provenance

Interaction inspiration only; no competitor implementation, questionnaire wording, profile data, images, or scoring copied:
- https://github.com/RomanCypherpunk/12axes/commit/19bd7c1165dedff88c990a37f936464abdf57651
- https://github.com/RomanCypherpunk/12axes/commit/336cb2c0a0bd600ccda1ea06cedd8d8d326af382

Workflow reference: upstream `obra/superpowers` planning, test-driven-development, executing-plans, and verification-before-completion skills. The ChatGPT Superpowers plugin was not installed in this session; this is a documented-workflow adaptation, not a plugin or subagent execution claim.

## Execution record

- Local projection RED: nine tests, eight expected missing-feature failures against empty stubs.
- Local projection GREEN: nine tests passed against the implementation.
- The local environment could not clone GitHub (DNS unavailable); full-repository execution is delegated to the repository's actual CI, not simulated. Browser and final CI evidence are recorded in the PR.
- No inference, release manifest, item wording, public route, or internal-reference publication changes are intended.
