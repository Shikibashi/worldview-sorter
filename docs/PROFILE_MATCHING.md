# Typed, source-linked reference comparisons (v2)

The current matcher compares actual questionnaire responses with explicitly scoped academic reference criteria. It is **not an identity classifier** and has no political centroid or numeric targets for categorical philosophical positions.

## Inputs

`matchProfiles({ catalog, policy, bank, scalesDoc, input })` requires an exact bank version and raw responses carrying `itemId`, `itemRevision`, `state`, and `value`. A full validated pilot session can be supplied because those fields are retained. When presentation records are supplied, an unpresented or branch-skipped item cannot provide evidence.

Legacy `constructEstimates` and detached `probeResponses` are rejected. The previous four Objectivist probes did not belong to the administered bank; current criteria refer to real versioned bank items instead.

## Evidence states

Each criterion records its individual observations. Supported and opposed responses require the explicitly specified values for that item revision. Neutral is a substantive observation but neither agreement nor rejection. `no_view`, `not_understood`, and `not_applicable` remain distinct. Missing observations do not become midpoint values or presumed agreement.

At least two distinct item observations are required for directional corroboration. This is a transparent, authored development rule, not a validated threshold. Any conflicting directional evidence is reported as mixed rather than averaged away.

Reference outcomes are `material_divergence`, `mixed_evidence`, `partial_evidence`, `insufficient_evidence`, and `compatible_on_measured_commitments`. The last means only that the explicitly tested commitments agree with the specified reference criteria. Untested commitments and interpretation disputes are retained in each profile’s scope and limitations.

## Identity and calibration

Every output has `publicIdentityLabel: null`, `selectedProfileId: null`, `percentageMatchAllowed: false`, and `interpretationAllowed: false`. Several references can be compatible at once. The engine does not force a closest profile.

A self-reported identity is returned separately as self-report. It does not alter evidence, turn a mismatch into a match, or count as validation. Changing a catalog’s status flag to `calibrated` is refused by this prototype engine; calibration requires an independently justified model and interface, not a configuration shortcut.

## Philosophical controls

The academic regression suite includes both sides of the original confusion. Political similarity without defining commitments cannot establish Objectivism, but Rand-compatible fallible judgments, revisable concepts and rejection of independently instantiated universals also cannot automatically exclude it. See the [academic grounding dossier](ACADEMIC_GROUNDING.md) and [source matrix](../research/academic/CONSTRUCT_SOURCE_MATRIX.md).

Other controls separate ethical, rational and psychological egoism; ownness and chosen care; abstract objects and universals; easy ontology and external-world realism; political obligation and state abolition; and promises, exit, reliance and remedies.

## Follow-ups

`planProfileFollowups(...)` proposes missing existing item IDs and revisions within a requested budget and includes branch prerequisites. It does not fabricate answers or estimate item information. This is an uncalibrated evidence-completion planner, not an IRT adaptive test and not yet a deployed result-page feature.

## Schemas and history

The new contract is documented in `schemas/profile-evidence.v2.schema.json`. Version 0.1 catalogs and schemas remain historical artifacts. Their old coordinate assumptions are not used by the active engine. The executable validator additionally verifies exact source/item references, disjoint answer mappings, and policy restrictions.
