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

The comparisons and engineering scores remain **unvalidated and non-interpretable**. The browser does not display them as worldview results. The follow-up planner identifies missing real questionnaire items; it is not calibrated adaptive testing and is not yet wired into the public interface.

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
