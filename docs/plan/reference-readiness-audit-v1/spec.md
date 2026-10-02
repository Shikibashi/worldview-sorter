# Reference-profile readiness audit v1

## Goal

Produce a deterministic report showing which independently sourced philosopher and tradition claims the active Worldview Sorter model can represent directly, partially, by route, or not at all. This is an instrument-coverage audit, not a public profile release, classifier, or empirical validation.

## Baseline inspected

- Main: `5486ec6b7cbd987c933135d7205731f886c090a3`.
- Open PR #31 is a separate inference-safety suite; this release branches from main and does not duplicate its changes.
- Model: `generic-1.16.0-pilot`.
- Affinity catalog: `philosophical-affinity-2.7.0`.
- Routes: Quick 64, Standard 120, Full 249 (`progressive-depth-2.7.0`).
- Candidate bank: `0.19.0`; source ledger: `0.20.0`.

The machine-readable audit pins the exact active paths, versions, and hashes. A future baseline change requires an explicit audit-spec revision.

## Decisions

1. Reuse the existing direct proposition engine only as a reference for identifiers and evidence paths. Audit output cannot alter respondent inference or affinities.
2. Decompose candidates into source-linked claims. Classify the mapping independently of candidate prestige or familiarity.
3. A partial mapping can never be promoted to direct by the builder.
4. Route capability is computed from exact item revisions and distinct authored evidence units against each frozen public route. These are authored evidence opportunities, not empirical item information.
5. Keep missing proposition, model-recognized but unadministered proposition, route-limited evidence, unsuitable criterion, and context-only material separate.
6. Report only categorical workflow readiness. Do not calculate a match, similarity, confidence, or readiness percentage.
7. Keep the report deterministic: no build timestamp, respondent data, or network fetch is required.

## Candidate selection

The set exercises epistemology, ethics, metaphysics, and political obligation: Pragmatism; scoped experience-grounded external-world empiricism; scoped act consequentialism; Ethical Egoism; Rand's Objectivism; philosophical anarchism; Peirce; Hume; Mill; early Confucian ethics; Stoic ethics; and analytic philosophy as an intentionally context-only umbrella.

The selected Objectivism and Ethical Egoism cases explicitly test false-positive boundaries: shared market views do not establish Objectivist foundations, and ordinary self-regard does not establish maximizing ethical egoism.

## Out of scope

No public cards, questions, rules, routes, affinity semantics, model manifests, historical releases, or application behavior change. The audit does not declare any doctrine or instrument valid.
