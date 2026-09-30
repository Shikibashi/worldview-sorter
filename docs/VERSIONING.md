# Versioning and identity

The project separates historical observations from interpretations.

## Permanent IDs

Construct IDs such as `ME01` and future item IDs are permanent identifiers.

- Never recycle a retired ID.
- Renaming a construct does not change its ID.
- Substantive redefinition requires a new construct ID.
- Deprecated constructs remain decodable in historical sessions.

## Independent versions

At minimum, production data must track:

- `schemaVersion` — shape of serialized records.
- `registryVersion` — construct/domain registry.
- `instrumentVersion` — exact set and revisions of items presented.
- `itemRevision` — wording/content revision of an item.
- `scoringModelVersion` — factor/IRT/keyed-scoring parameters.
- `profileModelVersion` — philosophical/worldview reference profiles.
- `formPolicyVersion` — selection or frozen-route composition.
- `modelVersion` — exact direct interpretation rules and source boundaries.
- `derivedInference.version` — conjunction or other permitted synthesis rules.
- `resultSemanticsVersion` — the meaning of supported, leaned, mixed, opposed, insufficient, and not measured.
- `evidenceThresholds.version` — editorial evidence-unit requirements, not calibrated cutoffs.
- `catalogVersion` and `affinitySemanticsVersion` — exact sourced doctrine, proposition mapping, and qualitative comparison semantics; neither is a respondent identity model.

These versions must not be collapsed into one application version.

An opted-in research contribution additionally records `consentVersion` and a separate `research-package-1.1.0` export format. The served consent terms are hash-pinned in `data/research/consent-v1.manifest.json`; a changed disclosure needs a new version, not an edit to historical terms. The package includes the exact bank, route, model, catalog, consent, and source snapshots needed to review the historical context. Current exports accept the active frozen pilot tuple; supporting a future instrument tuple requires a new explicit exporter/version path rather than silently remapping old responses.

## Raw responses are canonical

A historical session stores the exact item IDs/revisions shown and the raw response state.

Derived scores and respondent-facing summaries are reproducible snapshots tied to their model and rule versions. The raw answers remain canonical.

When scoring model 2.0 replaces 1.0, old raw sessions should be rescorable without changing what the respondent originally answered.

## Neutral is data

For Likert-style items:

- `answered + 0` means a genuine midpoint/neutral response.
- `no_view` means the respondent declines to express a view.
- `not_understood` means comprehension was insufficient.
- `not_applicable` means the proposition does not apply.

These states must never be serialized as the same numeric value.

## Instrument manifests

Every released form must have an immutable manifest mapping its compact item index to:

- permanent item ID;
- item revision;
- response scale;
- branch/eligibility rule.

A share code may compress by manifest position, but it must contain the instrument version needed to reconstruct that mapping.

## Scoring evolution

Hand-authored v0.x loadings are hypotheses.

Later calibration may change:

- item loadings;
- discrimination;
- thresholds;
- factor structure;
- short-form membership;
- construct promotion/demotion;
- profile matching.

None of those changes may mutate historical raw-response data.

## V1 pilot replay

The [v1 pilot manifest](../data/pilots/pilot-candidate-v1.json) freezes 238 ordered item revisions and separate instrument, interpretation, derived-rule, state-semantics, and authored-threshold versions. `generic-evidence-3` requires the exact instrument version and ordered presentation records before applying pilot semantics. This preserves the result under the pilot-era model. A future reinterpretation must name its newer model and preserve the old result as a separate versioned snapshot; it must not reinterpret old answers by changing the old model file in place.

The [first philosophical affinity catalog](../data/affinities/catalog-v1.json) is independently versioned and byte-pinned by its [manifest](../data/affinities/manifest-v1.json). An exported summary records the catalog, model, instrument, and result-semantics versions. A completed local quiz backup pins its catalog version; resume loads that version from the catalog registry and fails closed if it is unavailable. To replay a historical affinity result, load that exact catalog and matching pilot model; a changed doctrine or mapping requires a new catalog version and file. This catalog does not alter raw answers, the fixed route, or the pilot interpretation model.

## Progressive route replay

The [active progressive route definition](../data/experience/progressive-depth-v1.2.json) pins Quick, Standard, and Full item revisions, route versions, authored evidence opportunities, and adaptive policy version independently of the interpretation model. A saved depth administration contains ordered route-start, escalation, and clarification events. Clarification events preserve the reviewed candidate pool, candidate questions, withheld reasons, selected revisions, prior proposition states, and selection reasons. Completed stages preserve raw-response checkpoints and version references. Restore verifies this recorded history against the pinned route and bank; it does not rerun the current planner to guess old questions. See [route purposes and limits](PROGRESSIVE_DEPTH.md).

## Cross-component model release

[Model release 1.0.0](../data/releases/model-release-v1.json) binds the exact hashes and independent versions of the authored content, but predates executable-source pinning. [Model release 1.1.0](../data/releases/model-release-v1.1.0.json) adds an immutable archive of the nine route, response, interpretation, localization, and affinity modules. [Model release 1.2.0](../data/releases/model-release-v1.2.0.json) retires one unsupported public interpretation and pins successor model, route, affinity, and localization versions. The active [model release 1.5.0](../data/releases/model-release-v1.5.0.json) adds two federal-division items to a successor 240-item Full route and pins `quiz-1.9.0` in a new engine-source archive. Release 1.4.0 added the scoped Easy Ontology comparison. Release 1.3.0 added route-opportunity reason metadata and facet/domain assessment states. Item revisions, public rule evidence, and route assignments were unchanged in 1.4.0; release 1.5.0 changes them through versioned successor files. Production startup checks that the live modules match the archived source. Release 1.0.0 remains unchanged, and its exact historical engine behavior cannot be proven from its manifest alone. New administrations pin `modelReleaseVersion`; older sessions retain their component version tuple. Restore requires the pinned release when one is present. Research exports and share snapshots retain the pointer where applicable. Old manifests and files must remain available for historical replay. The active model embeds authoritative coverage; older standalone coverage snapshots remain historical and are not advertised as current. A new semantic release needs a new artifact path/version and an approved, source-linked [change proposal](governance/CONTRIBUTING.md); changing a frozen file or manifest in place fails validation.
