# Quick-route source qualification review

This review governs the successor to model release 1.10.0. It adds claim-level academic provenance to one existing Quick-route interpretation. The 566 candidate item revisions, 64/120/243 route order, evidence mappings, thresholds, and eleven affinity definitions remain unchanged. Earlier releases remain immutable.

## Approved narrow claims

| Rule | Exact respondent proposition | Direct items | Academic basis | Boundary |
|---|---|---|---|---|
| `audit2-EP06-testability` | Public repeatable testing merits greater confidence than a comparably unsupported private method. | `EPI004@2`, `EPI026@1` | [SEP, Theory and Observation in Science, §2.1](https://plato.stanford.edu/entries/science-theory-observation/) discusses intersubjectively ascertainable observation and publicly appraisable testing, while explaining theory-ladenness. | This comparison does not establish that science is the only way to know anything or that private experience has no personal evidential value. |

The source supports the philosophical distinction, not the questionnaire wording, the two-unit editorial threshold, or psychometric validity. The rule retains its existing supporting and opposing answer directions. A single directional unit can only produce `leaned_toward`; mixed directions remain `mixed_context_dependent`, and unanswered presented items remain `insufficient_evidence`.

## Reviewed but not promoted

- `ph-expert-testimony`: `EPI005@2` asks whether qualified consensus is **substantial** evidence, whereas `EPI018@1` asks whether it counts for **little** without personal verification. Disagreeing with one wording does not establish the other's exact magnitude. [SEP, Social Epistemology, §3.6](https://plato.stanford.edu/archives/fall2020/entries/epistemology-social/) supplies context for expert testimony but cannot repair that answer mapping. The inherited rule remains scoped and lacks a supporting claim-level link.
- `audit2-EP10-revelation`: the current questions do not settle first-person justification versus public factual warrant with sufficient clarity for a new academic claim link. The existing [revelation review](REVELATION_JUSTIFICATION_REVIEW.md) remains controlling; the rule is not broadened.
- `construct-AH14`: [the prior free-will condition review](FREE_WILL_CONDITION_REVIEW.md) found that Quick's `AHI103@1` and `AHI104@1` largely repeat the fixed-prior-condition framing while omitting `AHI105@1`, a compatibilist alternative. [SEP, Arguments for Incompatibilism](https://plato.stanford.edu/entries/incompatibilism-arguments/) supports the conceptual distinction but cannot make the current two Quick questions independently discriminating. The rule and route remain unchanged; an exact AH14 source claim requires a separately versioned evidence-path correction.

Regression coverage: [`scripts/test-quick-source-qualification-release.mjs`](../../scripts/test-quick-source-qualification-release.mjs) checks exact revisions, positive/opposing/mixed/missing cases, neighboring false positives, route invariance, affinity invariance, unchanged AH14, and historical model evidence.
