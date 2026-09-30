# Editorial review: prototype v0.1 → v0.2

Historical milestone. The comprehension gate below records the v0.2 editorial policy; current [model governance](governance/CONTRIBUTING.md) permits documented AI philosophical, linguistic, and engineering review without mandatory human interviews. AI review does not establish how real respondents actually understand an item.

## Scope

All 60 architecture-prototype items were reviewed for:

- double-barreled wording;
- construct contamination;
- theoretical exclusions hidden in wording;
- tautological or weakly discriminating stems;
- socially obvious responses;
- jargon and reading burden;
- mirror asymmetry;
- ambiguous quantifiers;
- response-scale mismatch;
- inline "unsure" options that duplicate `no_view` / `not_understood`;
- target mismatches;
- structurally attractive catch-all answers.

The machine-readable decisions are in `data/reviews/editorial-audit-v0.1.json`.

## Outcome

- 60 items reviewed.
- 29 received revision 2.
- 31 passed to cognitive review without a wording revision.
- No item is marked psychometrically validated.

## Structural corrections

### Free will

The original `AHI001` defined genuine freedom in opposition to being the result of prior causes. That accidentally excluded compatibilist conceptions and contradicted the registry rule that free-will belief and determinism are separately measurable.

Revision 2 asks about genuine control without building indeterminism into the definition.

### Partiality vs collectivism

`SOI005` is a tradeoff between special obligations and impartial moral scope. Its original secondary target was collectivism (`SO02`), which is not the same construct.

Revision 2 cross-loads instead to `NE09`, special obligations / partiality.

### Values response mode

`VAI001` through `VAI004` concern value importance. Agreement with a sentence saying a value is important is an avoidable extra linguistic layer.

Revision 2 uses `importance5` directly.

### Coordination mechanism

The first version of `PLI005` offered a generic "mixed / depends on the domain" answer alongside market, democratic, and expert coordination. That option was structurally safer and broader than the other alternatives.

Revision 2 asks respondents to rank the three mechanisms rather than rewarding the generic middle response.

### Missing-position states

`MEI005` and `MSI005` embedded "unsure" inside substantive response options even though the engine separately supports `no_view` and `not_understood`.

Revision 2 leaves only a substantive "none of these descriptions fits well" option.

## Known pool-level weakness: keying imbalance

The prototype was designed to prove architecture, not reliability, and is overwhelmingly positively keyed.

That is now an explicit warning rather than an invisible defect.

The research-bank expansion should:

1. add counter-keyed items for constructs measured through agreement scales;
2. avoid mechanically negating existing items merely to hit a quota;
3. use semantically natural opposing statements where possible;
4. keep true independent constructs independent rather than manufacturing bipolar pairs;
5. analyze acquiescence empirically after pilot data exist.

## Cognitive review gate

No item moves from `candidate` to `pilot` until cognitive interviews or an equivalent structured comprehension review examine:

- what respondents think the item is asking;
- how they interpret key terms;
- what examples they have in mind;
- why they chose their response;
- whether two respondents can choose the same response for materially different reasons;
- whether a disagreement response actually expresses the intended opposite construct;
- whether "neutral" means a midpoint rather than uncertainty;
- whether any option feels obviously socially preferred.

The v0.2 pool remains a candidate pool.
