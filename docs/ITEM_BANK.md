# Item-bank architecture

## Status

`candidate-v0.1.json` is a **60-item architecture prototype**, not a public short form and not a validated psychological or philosophical instrument.

Its purpose is to force the implementation to support heterogeneous response types, raw response states, branching, permanent revisions, and content metadata before a large item pool exists.

## Permanent item identity

Items use permanent IDs such as:

```text
MEI001
NEI001
...
PLI005
```

The prefix identifies the owning UI domain, not the scored construct.

An item may target more than one construct, but those targets are theoretical hypotheses, not scoring weights.

When wording changes in a way that may alter interpretation, increment `revision`.

Never recycle a retired item ID.

## Intended targets are not loadings

An item target contains:

- `constructId`
- `relation`: `positive`, `negative`, `diagnostic`, or `tradeoff`
- `role`: `primary` or `secondary`

There are deliberately no numeric factor loadings or weights in the item bank. Those belong to a future versioned scoring model.

## Response states

A normal Likert midpoint is substantive data:

```text
state = answered
value = 0
```

It must not be collapsed with:

- `no_view`
- `not_understood`
- `not_applicable`

The latter are different forms of missing substantive position data.

## Response types

The architecture currently supports:

- `likert`
- `single_choice`
- `vignette_choice`
- `paired_choice`
- `ranking`

This is intentional. The project must not regress into treating every philosophical distinction as an agree/disagree proposition.

## Mirrors

A mirror group is reserved for items intended to express opposite directions on the same underlying construct.

Do not use mirrors to encode merely correlated constructs.

Examples that must never be treated as mirror pairs:

- free will and determinism;
- individualism and collectivism;
- consequence sensitivity and deontic constraints;
- religious belief and secular political authority.

## Scenarios

`scenarioGroup` groups vignette variants for future counterbalancing and local-dependence analysis.

Scenario variants should not appear adjacent in an instrument.

## Branching

Eligibility rules act on **prior raw responses**, not provisional latent scores.

The prototype includes one example: the personal/agentic-divinity item is shown only when the preceding divinity item leaves a divine reality as a live possibility.

A skipped branch item remains present in the immutable instrument manifest and is recorded as not presented in the response session.

## Provenance and licensing

Every item records provenance.

The initial 60 items are original project drafts inspired by construct-level literature, not copied questionnaire text.

Their content-license metadata remains `undecided` until the project explicitly chooses a license. Do not silently import copyrighted questionnaire wording.

## Instrument manifests

A released manifest freezes the exact item IDs and revisions used by that instrument version.

A compact share format may serialize by manifest index, but it must preserve the instrument version so the exact historical mapping can always be recovered.

## What happens next

The 60-item pool should undergo editorial and cognitive review first.

After the architecture is stable, expand toward the planned ~472-item research bank. Only empirical pilot data should determine item removal, estimated loadings, thresholds, dimensionality, reliability, DIF, and short-form selection.
