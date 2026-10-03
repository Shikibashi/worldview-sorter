# Tradition explorer: Superpowers continuation review

Review base: PR #40 at `2929e3b229c02e307ec52ac4a1f465d6b91565da`.
Original application base: `f73dc20b1a94e4609394db6b1be2ecd7bdcf94ed`.

## Scope and decision

The installed Superpowers skills were read on this continuation, including executing-plans, systematic-debugging, test-driven-development, verification-before-completion, using-git-worktrees, and requesting-code-review. The earlier plan's statement that the plugin was not installed describes the earlier session, not this continuation. No fresh-context reviewer/subagent was available; this is an author self-review.

Resume the existing implementation rather than create a second explorer. The current review changes presentation only. The repository's DESIGN.md requires missing, mixed, and insufficient evidence to remain distinguishable. The actual affinity engine, summary presentation qualification, and App clarification interfaces were inspected before the correction.

## Corrected finding

The new explorer replaced every mapped criterion's finding with `under_review` whenever the proposition lacked eligible presentation review. This hid `unmeasured`, `contradictory`, `unresolved`, and `partial` distinctions, despite those limitations coexisting with a scope/source warning. It also relabeled unknown findings as review-only.

The projection now returns a separate `reviewRequired` flag. Open, partial, and unavailable findings remain visible. Unreviewed `overlap` and `divergence` remain withheld as `under_review`; this correction does not promote them. The component renders the review warning independently from the evidence label. Review-ineligible propositions still cannot supply follow-up domains. Historical summary objects are not mutated.

## Observed verification

Because GitHub/npm DNS failed in the working container, the focused tests used an isolated partial source snapshot fetched through the connector. Before testing, the helper, original test file, and component bytes were verified against their Git blob SHAs. This was not a full repository checkout.

- Baseline: original 9 tests passed.
- RED: the original 9 passed and 4 new regression tests failed with the expected assertions.
- GREEN and final rerun: all 13 focused tests passed.
- Matrix coverage: inherited scope, missing source claim, absent review metadata, omitted evidence, mixed evidence, no-view/insufficient evidence, partial mappings, derived unresolved evidence, withheld settled findings, unknown findings, and no new follow-up eligibility.
- The component passed TypeScript JSX syntax/transpilation. This does not establish React runtime behavior.
- The correction diff passed `git diff --check` and was inspected separately from implementation.

## Remaining gates — keep draft

The complete repository suite, production build and artifact verification, supported-version React execution, browser regressions, accessibility, and mobile reflow have not run in this continuation. GitHub returned no workflow runs for the pre-correction PR head. No cause for missing CI is established by that empty result.

One additional source-display review item remains: the reused `Pattern` renderer gates its evidence/source detail block on having answer observations. Before claiming complete source visibility, test and correct the explorer's provenance display for unmeasured and derived rows with no attached answer observations. The present correction is limited to evidence-state preservation; it does not claim that separate rendering issue is fixed.

No inference rules, item bank, public routes, catalogs, source ledgers, release manifests, or historical releases are changed. Nothing is merged or deployed. Full browser verification and a fresh review remain prerequisites to marking this PR ready.
