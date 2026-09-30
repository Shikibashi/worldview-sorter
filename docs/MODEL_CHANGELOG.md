# Philosophical model changes

## Model release 1.0.0 — operational baseline

This manifest pins the existing authored pilot item bank, construct registry, interpretation model, route policy, affinity catalog, source records, localization bundles, and result-semantics label. It predates executable-source pinning, so its exact historical engine behavior cannot be proved from the manifest alone. It is not psychometric validation.

## Model release 1.1.0 — executable-source pin

[Release 1.1.0](../data/releases/model-release-v1.1.0.json) adds the immutable [engine-source 1.0.0 archive](../data/releases/engine-sources/engine-source-1.0.0/manifest.json). It hashes the route, response, interpretation, localization, and affinity modules used by new administrations. The [AI-reviewed change record](../data/governance/proposals/MCP-2026-006.json) documents the branch-skip evidence correction and its historical limit. No item, rule, route, affinity doctrine, or raw answer changed in this release. Its channel configuration was `channels-v2.json`; `channels-v1.json` remains available with the earlier complete bundle.

## Model release 1.2.0 — retire the conflated SO09 interpretation

[Release 1.2.0](../data/releases/model-release-v1.2.0.json) retires the public SO09 rule because `SOI004@2` asks whether an equal claim can occur while `SOI029@1` asks usual priority in one matched choice. The [released proposal](../data/governance/proposals/MCP-2026-007.json) and [evidence review](governance/MORAL_SCOPE_EVIDENCE_REVIEW.md) record the philosophical and behavioral case. The direct public rule count changes from 141 to 140; SO09 becomes an explicit coverage gap. The associated prototype comparison and form opportunity bundle are removed. Quick, Standard, and Full keep the same 64/120/238 item IDs, revisions, and order, with new route/form versions. The affinity doctrines and translated wording do not change; their catalogs have new model-binding versions. Historical releases 1.0.0 and 1.1.0 remain byte-pinned. This release's channel configuration was `channels-v3.json`. No respondent answers were rewritten, and no psychometric inference is claimed.

## Model release 1.3.0 — explain measurement opportunity

[Release 1.3.0](../data/releases/model-release-v1.3.0.json) pins [engine-source 1.1.0](../data/releases/engine-sources/engine-source-1.1.0/manifest.json) under the [reviewed change record](../data/governance/proposals/MCP-2026-008.json). Direct proposition states and evidence thresholds stay the same. New results distinguish route omission, skipped conditional paths, and instrument-wide one-sided rules in internal metadata; respondent no-view answers remain insufficient evidence when questions were available. The public summary explains these cases and describes facet/domain assessment status. The 562 bank items, 140 public direct rules, and 64/120/238 route item revisions are unchanged. `channels-v4.json` targets this release. Earlier manifests and engine archives remain byte-pinned.

## Model release 1.4.0 — scoped Easy Ontology comparison

[Release 1.4.0](../data/releases/model-release-v1.4.0.json) adds a seventh public doctrinal comparison for the limited `OM14` methodological proposition. The three existing `OMI109@1`, `OMI110@1`, and `OMI111@1` items support or oppose that proposition only on Full; Quick and Standard leave it unmeasured. Wider application of the method and its compatibility with realism remain explicitly unmeasured or disputed. Ordinary-object realism cannot substitute for the method. The [governed proposals](../data/governance/proposals/MCP-2026-011.json) and [regression](../scripts/test-easy-ontology-release.mjs) record sources and false-positive controls. The release pins [engine-source 1.2.0](../data/releases/engine-sources/engine-source-1.2.0/manifest.json) for the new `quiz-1.8.0` client version. The bank, 140 public direct rules, and 64/120/238 exact item assignments are unchanged; earlier release manifests remain available. `channels-v5.json` targets this release. This is an authored comparison, not psychometric validation.

Future entries should summarize user-visible question/result changes, editorial corrections, model and research changes, and deprecations using `node scripts/model-governance.mjs notes --from OLD_MANIFEST --to NEW_MANIFEST`. Link each entry to its immutable manifest and proposal. Keep historical text, rules, and executable archives available.
