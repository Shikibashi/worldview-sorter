# Construct model

## Purpose

The registry defines what the project intends to measure before the item bank and scoring model are allowed to hard-code assumptions.

The registry is **not** a claim that all listed constructs have already been shown to be psychometrically distinct. In v0.1 every construct is provisional.

## Measurement types

### Monopolar

An independently estimated intensity. A high value on one monopolar construct does not require a low value on another.

Examples: Care, Authority, free-will belief, determinism belief, market-coordination preference.

### Bipolar

A proposed continuum with substantively opposing poles. Bipolar status is provisional until data support a roughly unidimensional opposition.

Examples currently include centralization/decentralization and reform/rupture.

### Affinity

Several orientations can be endorsed simultaneously. Affinity scores must not be normalized to sum to 100 unless a later statistical model specifically requires it.

Examples: virtue orientation, contractualism, distributive-principle families.

### Categorical

A philosophical position family usually assessed through diagnostic/branching questions rather than a one-dimensional score.

Examples: metaethical truth-aptness, personal identity theory, laws of nature.

### Hierarchical

A broad family containing lower-order facets.

Examples: humanity-nature worldview and religious/spiritual centrality.

### Derived

An interpretation computed from other constructs and usually confirmed by dedicated branch questions.

Derived constructs are never directly scored from an independent item pool in v0.1.

## Tiers

- **headline**: eligible for short-form coverage and the public summary.
- **primary**: targeted by the standard instrument.
- **diagnostic**: conditionally asked when prerequisites make the distinction meaningful.
- **research**: long-form or experimental until evidence supports promotion.

Tier is a product/measurement decision, not a statement that one philosophical issue is more important than another.

## Relationship rules

`data/relationships.json` is deliberately separate from `data/constructs.json`.

It records:

- independence assumptions that prevent forced bipolarity;
- prerequisite relationships for branching;
- derived-from relationships;
- related-but-not-identical warnings;
- anti-inference rules designed to prevent ideological or cultural proxies from silently defining philosophical constructs.

A relationship rule is a modeling constraint, not an empirical correlation coefficient.

## Current-policy content

Contemporary policies, candidates, parties, and culture-war questions must not define the core worldview model.

Such items may later appear in a separate criterion/issue module for:

- external validation;
- predictive analysis;
- longitudinal comparison;
- investigating how abstract commitments relate to concrete applications.

They must not be used as hidden shortcuts for assigning deeper philosophical scores.

## Auxiliary variables

The following should remain outside the core worldview score unless later research justifies a different role:

- personality traits;
- intelligence/cognitive ability;
- current mood;
- mental-health measures;
- party identification;
- candidate preference;
- social desirability;
- acquiescence;
- actively open-minded thinking;
- political knowledge;
- demographics.

Some are useful method controls or validation variables. They are not automatically worldview propositions.

## v0.1 criterion

Before item writing scales up, every new construct must answer:

1. What proposition or orientation is being measured?
2. Why is its measurement type appropriate?
3. What nearby construct could be confused with it?
4. Is it genuinely fundamental or merely a downstream attitude?
5. What would falsify the assumption that it deserves a separate score?
