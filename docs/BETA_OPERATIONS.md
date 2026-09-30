# Structured beta operations

This repository supplies beta controls and local reviewer tools. It does not itself provide hosting, TLS, an on-call rotation, or a public deployment. Use [application operations](OPERATIONS.md), [model governance](governance/CONTRIBUTING.md), [research separation](RESEARCH_DATA.md), and [current public limitations](BETA_KNOWN_LIMITATIONS.md) together.

## Release channels and flags

`data/releases/channels-current.json` selects the active immutable channel file. The release sync restores this pointer after generated content rebuilds.

`data/releases/channels-v2.json` declares the active `development`, `internal`, `preview`, `beta`, and `stable` channels; `channels-v1.json` retains the prior release configuration. `WORLDVIEW_RELEASE_CHANNEL` selects one at server startup (`stable` is the production default). The selected channel's manifest must match the complete deployed `data/current.json` bundle; a mismatch prevents startup. Stable and beta currently pin the same model release. To test a future beta model, create an approved immutable release, deploy its complete bundle to a separate beta environment, and point only the beta channel at it. Do not silently mix a beta rule with stable item/route data on one host. An administration records its channel and model release; previously saved browser administrations keep their pinned release.

Channel flags cover adaptive clarification, affinity display, sharing, and feedback. They govern presentation/availability only and cannot change interpretation or raw responses. Feedback additionally needs `WORLDVIEW_ENABLE_FEEDBACK=true` and, in production, `WORLDVIEW_FEEDBACK_DIR` on a private backed-up volume. Turn it off by disabling the variable and restarting. A channel-file change is a deployment change; review it, run beta tests, and deploy the complete configuration. Product events remain separately controlled by `WORLDVIEW_ENABLE_PRODUCT_METRICS`.

Staged rollout means separate preview/beta/stable deployments and an explicit promotion of the reviewed bundle. There is no live semantic A/B test or randomized model assignment. Product presentation experiments may use a feature flag; question wording, evidence rules, doctrine, and interpretation semantics require the editorial proposal and release process.

## Feedback and review

The quiz offers contextual question, result, and product/accessibility feedback when enabled. The server validates exact item/revision, route/version, model/result/affinity release, and localization bundle; it rejects unknown fields and raw answer payloads. It stores the category, optional text, version tuple, and a random report ID in a mode-0700 private directory. No quiz session ID, profile, account ID, answer, or research consent is attached. Users can still put sensitive material in optional text; reviewers must handle it as private. Browser feedback is not a research label.

Use local filesystem access for triage. There is no public admin endpoint:

```bash
node scripts/beta-feedback.mjs list --store /private/beta-feedback
node scripts/beta-feedback.mjs show --store /private/beta-feedback --id UUID
node scripts/beta-feedback.mjs triage --store /private/beta-feedback --id UUID --status triaged --class wording_comprehension --severity medium --note "Review exact wording"
node scripts/beta-feedback.mjs hotspots --store /private/beta-feedback
```

Statuses are `new → triaged → review_candidate → proposal_opened → resolved` with a documented `declined` path. The report remains immutable; the review sidecar records every decision. A per-report lock prevents simultaneous reviewer writes; if a reviewer process crashes, inspect its `.lock` and review history before removing that stale lock. Opening a proposal requires an existing `MCP-YYYY-NNN` file under `data/governance/proposals/`. Reports cannot edit production content. Counts prioritize investigation; many complaints do not prove that a proposition or doctrine is false.

Triage classes separate software, data-integrity, accessibility, wording, coverage, false-positive, false-negative, source, affinity, philosophical-disagreement, and feature-request issues. For “I am not X,” inspect whether the output claimed identity or affinity, the exact measured propositions, contrary evidence, missing defining doctrine, and wording before classifying a defect. Self-description is context, not a ground-truth label.

Publish confirmed product bugs, corrected philosophical errors, deprecations, and source corrections through public limitations and model changelog updates. Do not publish individual feedback text, identifiers, or worldview responses. Set a feedback retention and deletion schedule with the actual host operator before enabling the endpoint publicly; this repository does not enforce automatic feedback expiry or offer a self-service deletion endpoint.

Severity: **critical** for cross-user exposure, answer corruption, or severe auth/security failure; **high** for lost administrations, wrong release resolution, reproducible major false interpretation, or inaccessible core quiz; **medium** for plausible semantic wording defects, isolated affinity/source errors, or non-core localization; **low** for copy and nonessential polish. Escalate critical immediately to the incident owner. High content issues enter model review and may warrant channel rollback after reproduction. Ordinary philosophical disagreement alone is not a rollback trigger.

An authorized reviewer can use `node scripts/review-result-complaint.mjs --session /private/user-supplied-backup.json --target proposition:ID` (or `tradition:ID`). It validates the saved route and release and prints exact evidence, dependencies, affected doctrine, and sources. This output contains sensitive answers: keep it in a private reviewer environment. Request a user-exported backup only when necessary and with explicit agreement; do not copy production research records into developer fixtures. Reproduce defects with synthetic or sanitized fixtures and attach those, not the user record, to a proposal.

For a question translation report, use its pinned release from the feedback record with `node scripts/review-localization.mjs --item ITEM_ID --locale LOCALE --manifest data/releases/model-release-vX.json`. The report shows canonical and localized wording, answer scales, nearby rules, and terminology flags. Product-only localization reports may lack an item ID; request the exact screen or question reference before treating them as semantic evidence.

## Monitoring, comparisons, and rollback

`node scripts/beta-health.mjs --log /private/operational.jsonl --store /private/beta-feedback` summarizes operational errors, route starts/completions, clarification offers/requests/completions, feedback categories, and unresolved severe reports. Its counts have no respondent linkage or worldview outcome. Product events can indicate abandonment and route burden, but disabled telemetry, reloads, and self-selection limit interpretation. The current product event stream does not retain item-level uncertain/skip rates; do not infer those from feedback alone or introduce answer-like telemetry without privacy review.

Before promotion, use `node scripts/compare-beta-release.mjs --stable OLD_MANIFEST --beta NEW_MANIFEST --fixtures /private/synthetic-fixtures` and `node scripts/model-governance.mjs diff --from OLD_MANIFEST --to NEW_MANIFEST`. The comparison shows proposition, derived, affinity, domain-state, and route-coverage differences for synthetic sessions. Incompatibility is reported, not papered over. Explain intentional changes in the proposal and release notes. This is software regression analysis, not empirical calibration.

Rollback triggers include response corruption, broad result failures, route failure, severe new false-positive inference, materially altered translation, or privacy/security regression. Stop exposure to the affected channel, preserve private logs and manifests, restore the previous complete code/content bundle, and keep any newer historical artifacts required by browser saves. Verify `npm run verify:release`, `npm run verify:governance`, a browser restore, and research withdrawal before reopening. Do not rewrite raw answers or silently replace original results with a current reinterpretation. Restore drills and TLS/proxy behavior still need verification on the actual host.

## Stable promotion gate

Move beta to stable only when there are no unresolved critical security/data issues; core routes, save/restore, result generation, and withdrawal work on the deployed build; core accessibility blockers are fixed; feedback and private triage function; exact historical releases reproduce; high-severity content defects are resolved or prominently documented; backups and rollback have been restored in a non-production drill; and current limitations and model changes are published. This gate does not require unanimous philosophical agreement, improved satisfaction scores, or a claim of psychometric validity.
