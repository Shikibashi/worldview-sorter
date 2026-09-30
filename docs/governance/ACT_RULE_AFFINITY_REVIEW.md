# Scoped act and rule consequence comparisons

**Release target:** model 1.9.0, catalog 1.7.0. The catalog compares two already interpreted ethical criteria. It does not add questions, revise answer meanings, or classify anyone as a consequentialist.

## Academic and evidential scope

[SEP Consequentialism](https://plato.stanford.edu/entries/consequentialism/) separates direct act assessment, maximization, hedonism, aggregation, equal consideration, and decision procedure. Its act-consequentialist account concerns an act's own consequences. [SEP Rule Consequentialism](https://plato.stanford.edu/entries/consequentialism-rule/) separates a rule-based criterion of wrongness from rules used to deliberate while an act-based criterion remains in place. It also distinguishes the criterion of wrongness from sanctions and debates which consequences select a code. These sources support the doctrinal distinctions; they do not validate Worldview Sorter's original questions.

| Scoped comparison | Exact public proposition | Direct evidence | Important unmeasured doctrine |
| --- | --- | --- | --- |
| Act consequentialism (scoped criterion) | `reviewed-NE22-act-consequence-criterion`: an act's own consequences ultimately determine rightness, and an available act with a better outcome for everyone affected rules out a worse act as permissible. | `NEI122@1` act-outcome answer and `NEI014@1` opposing permissibility of the dominated act. | What counts as good; welfare or other values; distribution; actual versus expected consequences; deliberation. |
| Rule consequentialism (scoped criterion) | `reviewed-NE23-rule-consequence-criterion`: conformity to consequence-justified rules can determine act rightness even when this act alone would do better. | `NEI122@1` rule-outcome answer and `NEI123@1` general-consequences justification. | The full code; acceptance versus compliance; exceptions; sanctions; what counts as good. |

Both propositions were separately approved and tested in [the act criterion review](ACT_CONSEQUENCE_REVIEW.md) and [the rule criterion review](RULE_CONSEQUENCE_REVIEW.md). This catalog release reuses those propositions. It does not use raw answers for affinity evaluation. The [claim ledger](../../data/generic/source-ledger-v0.10.json) links the two SEP claims to the public rules, and [catalog 1.7.0](../../data/affinities/catalog-v1.7.json) links the claims to each new doctrinal criterion.

## Counterexamples and limits

- Generic concern for good outcomes can coexist with duties or a rule criterion. It cannot substitute for the direct act criterion.
- Following useful rules can coexist with direct act assessment. It cannot substitute for a rule-based criterion of wrongness.
- An independent duty can sustain a rule against harm without its ultimate justification resting on consequences.
- A welfare-maximizing choice in one vignette does not establish utilitarianism, hedonism, or aggregation.
- The act and rule entries share `NEI122@1`, but each needs a different second unit. An overlap with one entry therefore does not by itself establish divergence from the other.

Quick and Standard omit the two criterion bundles, so both comparisons remain unmeasured there unless a user voluntarily answers relevant follow-ups. Full has the authored opportunity, while missing or non-directional answers remain insufficient and contradictory answers remain mixed. The result engine supplies no identity, percentage, ranking, or mutually exclusive winner. The new catalog and route binding are versioned; the nine-entry catalog and 64/120/243 item sets from release 1.8 remain historically resolvable.

The [regression](../../scripts/test-act-rule-affinity-release.mjs) covers overlap, divergence, mixed, missing, short-route omission, generic-outcome and generic-rule false positives, simultaneous independent affinities, raw-answer isolation, and historical replay. Human comprehension and observed item behavior remain open empirical questions.
