# Worldview Sorter

A research-first, 12-panel worldview inventory inspired by the usability of 8values/9Axes/12Axes, but designed around heterogeneous measurement rather than a fixed set of hand-authored bipolar axes.

## Core design rule

**Twelve is the interface organization, not the statistical model.**

The instrument may contain dozens of separately estimated constructs underneath twelve public-facing domains. Constructs may be bipolar, monopolar, categorical, hierarchical, affinity-based, or derived. They must not be forced into two-ended percentage bars merely for visual symmetry.

## Initial domains

1. Metaethics
2. Normative ethics
3. Moral foundations
4. Values & axiology
5. Epistemology
6. Metaphysics & ontology
7. Mind & self
8. Agency & human nature
9. Religion & cosmology
10. Existential orientation
11. Social ontology & human relations
12. Political, legal & economic philosophy

## Repository model

- `data/domains.json` — the twelve UI domains.
- `data/constructs.json` — permanent construct IDs and measurement metadata.
- `data/relationships.json` — logical/dependency rules and explicit anti-inference rules.
- `schemas/construct-registry.schema.json` — machine-readable validation contract.
- `docs/CONSTRUCT_MODEL.md` — interpretation and modeling rules.
- `docs/VERSIONING.md` — immutable ID and versioning policy.
- `scripts/validate-registry.mjs` — dependency-free registry checks.
- `.github/workflows/validate-registry.yml` — CI validation.

## Measurement types

- `monopolar` — independent intensity; high X does not imply low Y.
- `bipolar` — genuinely opposing poles; use sparingly and validate empirically.
- `affinity` — several orientations may all be high.
- `categorical` — alternatives usually resolved through branching/diagnostic items.
- `hierarchical` — broad construct with separately measured facets.
- `derived` — computed interpretation; never directly measured as a standalone score.

## Tiers

- `headline` — candidate for short-form summaries and the share card.
- `primary` — standard public instrument.
- `diagnostic` — conditional follow-up when prerequisites make the distinction meaningful.
- `research` — long-form/experimental until evidence supports promotion.

## Non-negotiable data rules

1. Raw item responses are stored independently from derived scores.
2. Neutral is not the same as “no view.”
3. Item IDs and construct IDs are permanent and never reused.
4. Scoring models are versioned separately from instruments and item wording.
5. A changed scoring model must be able to rescore historical raw responses.
6. Current political-policy positions do not define deeper worldview constructs.
7. Philosophical/profile matching is a secondary interpretation layer, not the scoring model.
8. Logical relationships are not assumed to be empirical correlations, and empirical correlations are not treated as logical identity.

## Status

This repository is currently at **construct-model v0.1 / candidate research bank v0.8 / pilot architecture v0.1**. The bank contains 472 versioned candidate items. Raw pilot-session, calibration-export, versioned scoring, and empirical short-form selection machinery now exist, but the registry and item assignments remain theory-driven and provisional. The project has not yet established an empirical factor structure, calibrated item parameters, validated scoring model, or validated short form.



## Browser pilot runner

A dependency-free pilot administration client now lives in `apps/web/`.

Run it from the repository root:

```bash
npm run web:serve
```

Then open `http://localhost:4173/apps/web/`.

The runner generates seeded pilot packets, administers branching items one at a time, autosaves raw sessions locally, resumes interrupted sessions, and exports the exact versioned pilot-session JSON used by the calibration tooling. It does not display worldview scores.


## Remote collection service

`npm run server:start` now serves the browser runner and the raw-session collection API from one same-origin Node service.

Completed sessions are server-validated against the exact active bank, seed-generated packet, revisions, response scales, and branch state before immutable storage.

See `docs/COLLECTION_SERVICE.md`.

## 12Axes-style interaction parity

The runner follows the modern 12Axes interaction pattern for one-question flow, progress, selected-answer feedback, 200 ms auto-advance, Back, length presets, and completion submission while retaining Worldview Sorter's heterogeneous item types.

See `docs/12AXES_PARITY.md`.


## Doctrine-gated profile matching

Worldview labels are not assigned by nearest political-vector distance.

The profile layer supports abstention, direct doctrinal gates, explicit contradiction handling, affinity-vs-identity separation, and explicit identity confirmation. Percentage "match" presentation is prohibited.

The Objectivism regression case specifically guarantees that strong free-market/property/secular overlap cannot produce an Objectivist identity when core Objectivist doctrine is rejected.

See `docs/PROFILE_MATCHING.md`.
