# Pilot and scoring architecture

## Purpose

This phase makes the research bank executable without pretending the project already has a validated psychometric model.

The architecture separates:

1. raw pilot observations;
2. engineering-only scoring;
3. calibration exports;
4. empirical item parameters;
5. versioned result snapshots;
6. future short-form selection.

Raw responses remain canonical. Every derived result can be discarded and recomputed.

## Pilot administration

`data/pilots/pilot-0.1.json` defines a planned-missing packet design.

The operational default packet is 120 items, with a configurable 80–160 range.

This is an engineering default, **not a statistical sample-size or optimal-test-length claim**.

Use:

```bash
npm run pilot:packet -- --seed demo --size 120
```

Packet selection is deterministic for a given seed, approximately proportional across domains, and preserves branch prerequisites. The packet generator also puts prerequisite items before conditional dependents.

A deployed study may assign packet seeds uniformly or through an externally controlled round-robin scheme.

## Raw pilot sessions

`schemas/pilot-session.schema.json` stores:

- pilot, bank, and instrument versions;
- packet ID and randomization seed;
- exact item IDs and revisions;
- presentation order;
- branch-skipped state;
- raw response state and raw value;
- response time;
- answer-change count;
- locale and client version;
- optional opaque respondent key.

Direct identifiers, raw IP addresses, and raw user-agent strings are excluded by pilot policy.

The optional respondent key exists only for intentionally linked repeated sessions. It should be an opaque pseudonymous identifier, not an email, name, account ID, or other direct identifier.

## Engineering-only scoring

`engineering-keyed-0.1` exists solely to prove that old sessions can be rescored under a named model version.

It:

- considers only primary targets;
- considers only signed positive/negative targets;
- considers only numeric `agreement5`, `importance5`, and `moral_relevance5` responses;
- normalizes each response to approximately -1..1;
- reverses negative-keyed items;
- takes an unweighted mean;
- reports answered/eligible coverage.

It explicitly excludes categorical, ranking, and ordinary diagnostic responses from scoring.

It has:

```text
status = engineering_only
interpretationAllowed = false
```

Do not display these engineering estimates to users as worldview scores.

Smoke test:

```bash
npm run pilot:score -- examples/pilot-session.example.json
```

## Result snapshots

Scoring output is a separate versioned object under `schemas/result-snapshot.schema.json`.

A snapshot records:

- session ID;
- bank/instrument version;
- scoring-model version;
- generated time;
- construct estimates;
- eligible/answered item counts;
- coverage;
- uncertainty field.

Engineering scoring sets uncertainty to null because no defensible uncertainty model exists yet.

A future calibrated model may replace every derived estimate without mutating the raw session.

## Calibration export

Export a directory of raw sessions:

```bash
npm run pilot:export -- ./sessions > calibration.jsonl
```

The exporter emits one long-format record per assigned item and deliberately excludes respondent keys and direct identifiers.

It preserves:

- special missing states;
- raw numeric/categorical/ranking values;
- item revision;
- presentation order;
- branch skipping;
- response time;
- answer changes.

This format can later be converted to R, Python, Stan, Mplus, lavaan, IRT software, or other analysis systems.

## Pilot summaries

```bash
npm run pilot:summary -- ./sessions
```

The summary reports per-item:

- assigned count;
- presented count;
- branch skips;
- answer/special-state counts;
- missing-position rate;
- mean response time;
- median response time.

These are descriptive diagnostics, not validity evidence.

## Empirical item parameters

`data/calibration/item-parameters.template.json` contains all 472 exact item revisions with null empirical parameters.

It intentionally contains:

```text
informationScore = null
eligibleForShortForm = false
status = template
```

A calibration process must produce a new file with `status = empirical` before short-form selection can run.

The parameter schema can carry:

- generic information score;
- discrimination;
- thresholds;
- DIF flags;
- local-dependence flags;
- quality flags.

The selector is intentionally model-family agnostic. A later calibration pipeline can populate these fields from graded-response IRT, nominal-response models, CFA-derived criteria, classical statistics, or a combination.

## Short-form selection

The short-form policy currently allows an operational 80–110 item range and requires at least one primary item for every headline construct.

This is feasible because there are 60 headline constructs. It does **not** require the short form to estimate all 122 public constructs independently.

Run only with real empirical parameters:

```bash
npm run shortform:select -- --parameters calibrated-parameters.json --size 96
```

The selector refuses `status=template` files.

It first covers required headline constructs with the highest-information eligible items, then fills remaining slots by empirical information score while respecting mirror limits and branch prerequisites.

Its output status is:

```text
empirical_candidate_not_validated
```

Even empirical selection does not by itself validate the short form. The selected form still requires evaluation against the long form and held-out data.

## What comes after this architecture

Once pilot data exist, the next scientific steps are external to the engineering-only scorer:

- response distributions and missingness;
- dimensionality investigation;
- EFA / parallel analysis where appropriate;
- held-out CFA/model comparison;
- ordinal/nominal IRT where appropriate;
- local-dependence analysis;
- reliability/model information;
- test-retest;
- convergent/discriminant evidence;
- DIF and measurement invariance;
- cross-validation of short-form selection.

Only then should the repository gain a scoring model with `status = calibrated` and `interpretationAllowed = true`.
