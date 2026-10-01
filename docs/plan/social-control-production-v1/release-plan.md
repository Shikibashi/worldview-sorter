# Social control of production release plan

## Decision

Add one scoped, directly interpreted political-economy proposition about preferences for democratic or socially accountable control over production in two stated settings: workplace decision-making and control of major productive enterprises. Require the two distinct answer units to align before reporting `supported` or `opposed`.

Use `PLI060@2` as the versioned workplace-level indicator and `PLI123@2` as the major-enterprise indicator. The existing engine requires at least two authored evidence units; the release will preserve that guard rather than lowering it for this one content gap.

## Scope and limits

- Add construct `PL39` and one direct rule. `PL35` is already reserved for a separate migration item target in `data/registries/dimension-gap-proposals-v1.json`; reusing it would conflate unrelated propositions. Add both exact item revisions to Full only, taking Full from 247 to 249 questions.
- Quick and Standard retain their exact item references and leave the proposition `not_measured`.
- The two items are complementary across decision scales, not paraphrases and not evidence of statistical independence.
- Preserve PLI060@1 in bank 0.18.0 and the unreleased PLI123@1 draft. No prior bank, route, model, affinity definition, or manifest is edited.
- Do not add or alter a socialist, democratic-socialist, or other tradition criterion in this release.

## Intended interpretation

The proposition is limited to whether the respondent favors meaningful worker or democratically accountable public control over the two explicit production settings, rather than private owner/manager control or state control insulated from workers and the public. Agreement with a single item yields only `leaned_toward`; opposite item directions yield `mixed_context_dependent`; non-directional answers do not vote. Missing route evidence stays `not_measured` and missing or nondirectional presented evidence stays `insufficient_evidence`.

The rule does not infer socialism, democratic socialism, communism, a legal ownership title, a market/planning preference, redistribution, state authority, or any complete economic system.

## Evidence

- The Stanford Encyclopedia of Philosophy's *Socialism* entry identifies social, democratic control of the bulk of productive assets as a minimum institutional contrast, distinguishes it from unaccountable state power, and notes disagreement about institutional forms and markets.
- The Internet Encyclopedia of Philosophy's *Socialism* entry distinguishes effective from merely legal ownership and private, state, and social control. It also treats the relation between social control and markets/planning as disputed.
- These sources support the conceptual distinction only. They do not validate either item, response interpretation, route, or two-unit threshold.

## Validation

Test aligned positive and negative patterns, opposed answers across the two settings, one-item evidence, mixed/no-view/other responses, missing answers, short-route omission, false-positive neighboring positions, exact revisions, and historical release replay. Run model/governance and route checks, the release regression, browser flow, production artifact verification, and final-head CI.
