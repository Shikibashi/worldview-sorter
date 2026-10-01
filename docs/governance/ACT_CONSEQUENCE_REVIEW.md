# Direct act-consequence criterion review

**Release:** [model 1.7.0](../../data/releases/model-release-v1.7.0.json). This is a narrow, authored ethical distinction. It does not identify a respondent as a consequentialist or utilitarian, and it does not validate a psychological scale.

## Exact inference

The public proposition is: “An act’s own consequences ultimately determine its moral rightness, and an available act with a better outcome for everyone affected rules out a worse act as permissible.” [SEP Consequentialism](https://plato.stanford.edu/entries/consequentialism/) distinguishes an act criterion of rightness from a rule criterion and discusses the maximizing requirement. [SEP Rule Consequentialism](https://plato.stanford.edu/entries/consequentialism-rule/) explains why a consequence-justified rule can remain the criterion even when a particular rule-breaking act seems to have better effects. These sources establish conceptual contrasts, not the validity of our questions.

| Exact item | Target and answer use | Limit |
| --- | --- | --- |
| `NEI122@1` (new) | Asks what *ultimately determines rightness* in a case where breaking a rule has the best outcome without weakening the rule. “This act’s consequences” supports; a consequence-justified rule or consequence-independent duty opposes; contextual choice is non-directional. | One answer alone is only a lean. The case does not measure a general decision procedure. |
| `NEI014@1` (existing, unchanged) | Tests whether an act with a much worse outcome for everyone affected can still be morally permissible. Disagreement supports a maximizing implication; agreement opposes. | Rejection of a dominated act alone does not show that consequences are the ultimate criterion. |

Both separate evidence units must agree to support or oppose the proposition. Conflict is mixed/context-dependent; a single directional unit is explicitly a lean; no-view, neutral, missing, and inapplicable evidence never become support. Quick and Standard omit both questions and yield `not_measured`; only the new 242-question Full route offers both. The existing 240-question Full route and all previous item revisions remain unchanged.

The principal false positives are generic concern for outcomes, a rule justified by good consequences, rejection of a bad outcome for an independent duty, and the claim that agents should *deliberate* about consequences. The rule does not establish what counts as good, how different people's welfare aggregates, hedonism, welfarism, utilitarianism, or any full philosophical identity. Satisficing and indirect consequentialist approaches remain nearby views that this two-question bundle may not completely resolve.

The [claim ledger](../../data/generic/source-ledger-v0.9.json), [source registry](../../data/sources-v1.3.json), [proposals](../../data/governance/proposals/MCP-2026-043.json), and [regression](../../scripts/test-act-consequence-content-release.mjs) pin the claim and behavior. The nine-entry affinity catalog is re-bound but gains no NE22 mapping. Human comprehension, response distributions, local dependence, and test-retest behavior remain untested.
