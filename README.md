# Worldview Sorter

Twelve interface domains, not twelve forced bipolar latent traits.

## Current release

Candidate bank **0.9.0** contains **562 original candidate items**. The registry has **182 permanent entries**, of which **181 are active**. One bundled legacy ontology construct is deprecated, not silently redefined.

This academic update adds 30 distinctions and 90 items. Its 25-entry source ledger distinguishes reviewed scholarly text, abstracts, and metadata-only references. These sources support conceptual distinctions; they do not validate the new questionnaire.

See [academic rationale](docs/ACADEMIC_GROUNDING.md), [item/source matrix](research/academic/CONSTRUCT_SOURCE_MATRIX.md), and [matching contract](docs/PROFILE_MATCHING.md).

## Run

```bash
npm run build:academic
npm test
npm run server:start
```

The development runner is served at http://127.0.0.1:4173/apps/web/. Do not expose a research-data deployment publicly without a deployment/security review.

## Evidence, not identity guessing

The nine reference comparisons consume exact item IDs, revisions and raw response states. No political centroid, categorical numeric proxy, chat memory, preferred identity, or personality/country resemblance supplies missing answers. Neutral, no view, disagreement and mixed evidence remain distinct. There is no forced winner, match percentage, or automatically assigned identity.

The comparisons and engineering scores remain **unvalidated and non-interpretable**. The public quiz summarizes explicit answer patterns with source links; it does not present engineering scores as validated worldview measurements. The follow-up planner identifies missing real questionnaire items; it is not calibrated adaptive testing and is not yet wired into the public interface.

## History

The 0.8 bank and instrument remain byte-for-byte frozen. New wording or targeting receives a new item revision. The 0.1 registry is archived; new observations use registry 0.2. Sources, release manifests, reference criteria and resulting comparisons are versioned independently.

## Commands

- `npm run test:profiles`: academic contrast and evidence-integrity regressions.
- `npm run test:collection`: collector integration tests.
- `npm run test:12axes`: packet and interaction-contract tests, not visual browser verification.
- `npm run test:ui-smoke`: executes the app against a small DOM harness; not a real-browser accessibility/layout audit.
- `npm run pilot:packet -- --seed example --size 120`: administration packet.

No participant responses or empirical item parameters were fabricated. Published MFQ-2, PVQ-RR, Free Will Inventory and Oxford Utilitarianism Scale validation does not transfer to this project's original items.

## Additional measurement limits

See [methodological disagreements and explicit-endorsement limits](docs/METAETHICAL_MEASUREMENT_LIMITS.md), including a 2026 critique of folk-metaethical classification. A new versioned packet-ordering algorithm fixes a regression exposed by the expanded bank while preserving historical v0.8 packet replay.

## Generic academic comparison layer

The active generic model covers all twelve domains using reusable, source-traceable commitments. Personal priorities, normative principles, descriptive beliefs, ontological claims and institutional prescriptions are not conflated. No profile is forced and no match percentage is produced.

`npm run worldview:compare -- responses.json`

`npm run worldview:followups -- responses.json 12`

See [the generic source/item matrix](docs/GENERIC_WORLDVIEW.md), [source access ledger](research/academic/GENERIC_SOURCE_LEDGER.md), and [coverage report](data/generic/coverage-v0.1.json). Existing sample collection and older comparison modules remain compatibility/development tools; the generic layer does not require cognitive review or claim empirical validation.

## Public quiz experience

The root now opens a field-guide-style quiz with 80/120/160-question routes, pause/resume, unchanged academic items, and a twelve-topic source-linked answer summary. It is an exploratory, research-informed quiz, not a validated assessment. Answers stay in the browser unless explicitly exported. The old `/apps/web/` route remains a development collector client.

Run `npm run server:start`, then visit `http://127.0.0.1:4173/`.

`npm run test:experience` checks the new controller, evidence summary, privacy-safe share projection and post-completion game boundary. The separate Quiz experience workflow tests the actual Chromium browser and publishes synthetic screenshots.

[Quiz experience and academic design rationale](docs/QUIZ_EXPERIENCE.md) explains future gamification. Game rewards are disabled by default and cannot use beliefs, scores, speed or ideological consistency. The current experience already provides a summary; no calibration flag has been used to claim validated worldview scores.

## Philosophy-domain content coverage

The public quiz uses a versioned content blueprint with separate ontology, metaphysics, metaethical, ethical, epistemic, and political/legal/economic facets. Every route asks multiple relevant questions for each facet rather than hoping proportional random sampling does so. Original item text is unchanged; academic citations explain conceptual scope, not scientific validation of custom items. See [the domain/source/evidence specification](docs/PHILOSOPHY_DOMAINS.md).
