# Direct consequence-justified rule criterion review

**Release:** [model 1.8.0](../../data/releases/model-release-v1.8.0.json). This is a narrow, authored ethical distinction. It does not identify a respondent as a rule consequentialist or utilitarian and does not validate a psychological scale.

## Exact inference

The public proposition is: “An act’s moral rightness depends on conformity to rules ultimately justified by their consequences, even when that act alone would produce a better outcome.” [SEP Rule Consequentialism](https://plato.stanford.edu/entries/consequentialism-rule/), especially sections 4 and 8, distinguishes a rule-based criterion of wrongness from a consequence-justified decision procedure. The latter is compatible with direct act consequentialism. Rule justification and act rightness therefore require separate evidence. The source explains the conceptual contrast; it does not validate these questions.

| Exact item | Target and answer use | Limit |
| --- | --- | --- |
| `NEI122@1` (existing) | In a case where breaking a rule has a better outcome without weakening the rule, a consequence-justified **rule as criterion** supports. The act's own consequences or an independent duty opposes. A context-dependent answer is non-directional. | One case does not measure a general decision procedure or full moral psychology. |
| `NEI123@1` (new) | Asks what *ultimately justifies* a rule against harming an innocent person. General consequences support; an independent claim against harm opposes. Reasonable agreement and plural grounds are non-directional because they can coexist with consequence-based justification. | One rule does not establish the optimal code, its acceptance conditions, or rules for blame. |

Both separate evidence units must agree to support or oppose the proposition. A single directional unit is a lean; conflicting directions are mixed/context-dependent. No-view, missing, and non-directional answers do not count as agreement. Quick and Standard omit both questions and yield `not_measured`; Full assigns both. The earlier 242-question Full route and all prior item revisions remain unchanged.

The main false positives are generic concern for outcomes, treating rules as useful decision aids while retaining an act criterion, deontological rule constraints, and agreement-based rule justification. `NEI123@1` alone cannot distinguish a consequence-justified rule of thumb from a criterion of rightness; `NEI122@1` supplies that contrast. Conversely, selecting reasonable agreement is not automatically opposition to a consequentially justified rule. The new rule does not establish what counts as good, how consequences are aggregated, utilitarianism, sanctions, or full rule consequentialism. It also does not settle disputed exceptions or the best formulation of rule selection.

The [claim ledger](../../data/generic/source-ledger-v0.10.json), [source registry](../../data/sources-v1.4.json), [governed proposals](../../data/governance/proposals/MCP-2026-051.json), and [regression](../../scripts/test-rule-consequence-content-release.mjs) pin the claim and behavior. The nine-entry affinity catalog is re-bound but gains no NE23 mapping. Spanish and Arabic remain draft, unavailable locales pending linguistic and philosophical review. Human comprehension, response distributions, local dependence, and retest behavior remain untested.
