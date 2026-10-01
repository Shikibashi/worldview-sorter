# Worldview Sorter repository rules

These instructions apply to this repository. Keep product strategy in the active goal and release-specific decisions in the relevant review document.

## Before changing the model

- Inspect `data/current.json`, the active manifests, the relevant source files, open PRs, and the current tests. Older roadmap counts are historical unless the active release confirms them.
- Trace public conclusions through exact propositions, item revisions, answer meanings, rules, and source claims. Raw answers do not map directly to philosophical traditions.
- Keep item targets, public propositions, hypothesized constructs, derived conclusions, research variables, and affinity criteria distinct. Missing evidence stays missing; synthetic profiles are software fixtures, not psychometric validation.
- Use the governance proposals and source ledger for substantive philosophical changes. Record neighboring views, non-entailments, likely false positives, affected routes and affinities, and historical consequences.

## Versioning and release boundaries

- Never edit a released item, rule, route, catalog, or model manifest in place. Create successor versions and preserve historical replay. A current reinterpretation of old answers must remain distinguishable from the original result.
- Edit authored sources and run the existing builders for generated artifacts. Do not hand-edit generated snapshots to make validation pass. Check that `data/current.json`, manifests, hashes, and current-facing documentation agree.
- Retain deprecated objects needed by historical administrations. A split or merge does not transfer old evidence automatically.
- Do not surface unavailable product behavior in respondent-facing copy or controls.

## Implementation and verification

- Keep PRs small and coherent. Use existing architecture before adding a parallel engine or broad infrastructure layer. Read `DESIGN.md` before changing the public UI.
- Keep the public questionnaire on its current fixed English wording. Changes to presentation scope require an explicit product decision. Retain older wording records only where required for historical replay; do not surface them as active product features.
- Run focused checks while iterating. Before an inference or release change is complete, run relevant model validation, historical regression, browser flows, and a production artifact check on the final HEAD. Report unrun checks and unresolved failures.
- Inspect the license and record provenance before reusing competitor code, assets, data, or questionnaire wording. Interaction ideas alone do not authorize copying or weaker scoring assumptions.
- Production is the static GitHub Pages site at `https://worldview.edriffles.us`. Keep `apps/server/`, `apps/web/`, private storage, research collector endpoints, and secrets out of the Pages artifact. Verify the deployed site and its version after merging a production release.
