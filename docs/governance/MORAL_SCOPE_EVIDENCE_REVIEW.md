# Moral scope: possibility versus usual priority

**Status:** released in [model release 1.2.0](../../data/releases/model-release-v1.2.0.json). The earlier pilot rule, routes, item revisions, and historical results remain available under their original releases.

The historical `audit2-SO09-moral-scope` rule states: “In a matched serious-harm case, a stranger abroad **can** have a moral claim as weighty as a community member.” Its two directional items ask different questions:

| Item | Positive answer | Negative answer | Scope |
| --- | --- | --- | --- |
| `SOI004@2` | Agrees a distant stranger **can** have an equally weighty claim. | Rejects that possibility. | Existential possibility; it does not say that claims are normally equal. |
| `SOI029@1` | Gives equal claims equal weight in an otherwise matched serious-harm choice. | Normally gives the community member greater weight in that choice. | Usual priority in a specified tradeoff; it does not rule out other cases of equality. |

The frozen rule requires two authored evidence units for `supported` or `opposed`. It treats agreement with `SOI004` plus local priority on `SOI029` as `mixed_context_dependent`. That combination need not be contradictory: a respondent may accept equal claims in some circumstances while allowing a special community obligation in the stated choice. The reverse pair can be inconsistent, but the rule does not know which explanation applies. Calling both “mixed” is a conservative engine state, yet its tension wording must not imply a proven contradiction.

The [SEP account of cosmopolitanism](https://plato.stanford.edu/entries/cosmopolitanism/) distinguishes strict moral cosmopolitanism, which denies an extra compatriot duty in aid decisions, from moderate cosmopolitanism, which recognizes universal duties alongside special duties. It separately distinguishes moral concern from political institutions. This is a conceptual basis for keeping the items apart; it is not evidence that either original item measures a validated trait or that a two-unit threshold is empirically sound. The source record `domain-cosmopolitanism` is currently attached at rule level, without a claim linked to this exact response mapping.

## Successor boundary

The successor retains the **possibility** as an item target and retires the conflated interpretation rule entirely. `SOI029@1` remains a separate contextual answer; its local-priority response no longer opposes the possibility claim. Moving the unchanged rule to research-only status would still compute the same misleading proposition. The model validator requires two distinct directional evidence units for an audited direct rule, so simply removing `SOI029` would have made a one-item public rule invalid. The [successor regression](../../scripts/test-so09-retirement.mjs) verifies that SO09 remains an explicit coverage gap, its comparison disappears, and positive, negative, mixed, and missing answer patterns no longer generate a SO09 inference. The old rule and historical results remain untouched.

If a future release needs a two-unit direct interpretation, it needs another question that targets the same **possibility** claim through a genuinely different case, or a separately defined **usual-priority** proposition with its own corroborating evidence. Merely changing “can” to “normally” would make `SOI004@2` unsuitable as corroboration. The choice of a broader cosmopolitan identity, open-borders policy, equal duties in every relationship, and a view about global institutions are all non-entailments.

The [released change proposal](../../data/governance/proposals/MCP-2026-007.json) records route, comparison, and release effects. The 238 assigned item revisions are unchanged; Quick, Standard, and Full now have independently versioned route metadata, with 140 public direct rules. No saved historical result is reinterpreted silently. Any later *new* public SO09 rule requires an exact reviewed proposition, genuinely discriminating corroboration, and a supporting source-to-claim link. The synthetic regression checks software behavior, not empirical validity.
