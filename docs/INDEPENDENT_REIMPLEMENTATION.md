# Independent reimplementation and reference-corpus policy

## Purpose

Worldview Sorter may study other public quizzes and philosophy tools for product ideas, but
its respondent model, philosopher profiles, tradition profiles, explanatory prose, mappings,
and source claims are authored independently.

This policy is a project engineering boundary, not a legal opinion.

## Authoring boundary

Third-party philosopher/profile datasets are **not content sources** for Worldview Sorter.
Do not copy, translate, paraphrase, transform, or mechanically import their:

- philosopher or tradition summaries;
- axis, pole, category, or taxonomy descriptions;
- profile coordinates, weights, rankings, or nearest-neighbor data;
- claim wording, argument wording, objection wording, or thought-experiment wording;
- source selections or source annotations as a package;
- profile coverage decisions, ordering, salience labels, or confidence judgments;
- identifiers or schema layouts when those are specific to another corpus.

Historical names and bibliographic facts can of course appear when independently sourced.
The selection of which figures and traditions Worldview Sorter covers must follow this
project's own twelve-domain coverage needs rather than reproduce another project's catalog.

## Allowed source set

New philosophical content must be authored from sources already accepted by Worldview
Sorter governance or newly reviewed through the same process:

1. primary philosophical texts;
2. signed scholarly reference works such as SEP or IEP;
3. peer-reviewed scholarship;
4. publisher or bibliographic metadata when only metadata-level claims are made.

A source explains a philosophical claim. It does not validate Worldview Sorter's custom
questions or permit copied questionnaire wording.

## Two-stage workflow

For substantial additions, separate **requirements** from **content authoring**.

### Stage A: requirements

Write the Worldview Sorter requirement only in terms of existing product gaps:

- which WVS proposition or domain lacks a useful comparison;
- which neighboring positions must be distinguished;
- which non-entailments must be preserved;
- whether the result belongs in a respondent comparison, context card, argument explorer,
  or unscored scenario.

Do not use a third-party profile as the specification.

### Stage B: independent authoring

Build the content from the allowed source set and the current WVS proposition registry.
Every claim must identify:

- the exact WVS proposition;
- expected support or opposition;
- importance: `core`, `major`, or `minor`;
- evidence basis: `primary_text`, `scholarly_reconstruction`, or
  `editorial_hypothesis`;
- claim-level source provenance;
- known limitations and nearby views.

`editorial_hypothesis` is context-only and cannot participate in respondent comparison.

## No imported coordinate system

Reference profiles must not contain or depend on another product's:

- numerical axis placements;
- vector embeddings;
- match percentages;
- distance functions;
- nearest philosopher/tradition labels.

Worldview Sorter compares exact interpreted propositions. It does not reverse-engineer or
translate external coordinates into its own model.

## No identity inference

A reference profile is descriptive comparison material, not a classifier. Its output is
claim-level:

- overlap;
- divergence;
- mixed evidence;
- not measured;
- insufficient evidence.

There is no aggregate percentage, nearest-profile winner, or assigned philosophical identity.

## Semantic-link layer

The optional semantic-link layer is independently derived from Worldview Sorter's existing
construct relationships, anti-inference rules, governed derived conclusions, tension
handling, and source ledger.

Semantic links can explain that propositions:

- can coexist;
- do not establish one another;
- provide explanatory support;
- need clarification when jointly endorsed;
- contradict one another when the recorded meanings genuinely conflict.

They cannot change a respondent's proposition state or affinity result. A genuine new
derived conclusion still requires the separately governed derived-rule process.

## Review checklist

A reference-profile or semantic-link PR is not ready until reviewers can answer yes to all
of the following:

1. Was the requirement stated independently of any third-party profile dataset?
2. Is every substantive claim supported by an allowed source?
3. Is all prose newly authored?
4. Does every mapping point to an exact current WVS proposition or a separately governed new
   proposition?
5. Are neighbors and non-entailments explicit where confusion is plausible?
6. Are hypotheses prevented from entering respondent comparison?
7. Are percentages, coordinates, and nearest-profile classification absent?
8. Are historical releases left untouched?
