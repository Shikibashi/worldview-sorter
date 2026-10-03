# Partial reference-profile audit v1

Baseline: `Shikibashi/worldview-sorter` main at `c3144aaeea8ea366c1b9f9020511f385b6f421d3`.

This review covers only the three candidates left in `PARTIAL_PROFILE_ONLY` by `reference-readiness-audit-1.0.0`: Ethical Egoism, Objectivism in Ayn Rand's formulation, and John Stuart Mill's utility criterion. The pinned readiness audit itself remains unchanged because its job is to record the broader candidate-level gaps against the active model. This review decides only whether narrower, independently authored internal reference comparisons can be added without treating a neighboring proposition as an exact doctrine.

Active baseline:

- candidate bank: `candidate-bank-0.19.0`
- worldview model: `generic-1.16.0-pilot`
- progressive routes: `progressive-depth-2.7.0`
- philosophical affinity catalog: `philosophical-affinity-2.7.0`
- public route sizes: Quick 64, Standard 120, Full 249

No active item, proposition, route, affinity, production pointer, or public UI file is changed by this audit.

## Ethical Egoism

### Exact active coverage

`construct-NE15` states:

> Each person morally ought to make their own long-term good the ultimate end of their actions; another person’s need alone supplies no independent moral reason.

Its authored minimum is two evidence units. The active evidence is:

| Item | Evidence unit | Role | Active route availability |
|---|---|---|---|
| `NEI100@1` | `NE-S01` | own-good ultimate moral end | Full |
| `NEI101@1` | `NE-S01` | near-parallel own-good wording | none |
| `NEI121@1` | `NEI121` | distinguishes an independent duty/reason from own-good-only moral reason | Full |

`NEI100@1` and `NEI101@1` are deliberately one evidence unit and cannot count as independent corroboration. Full can satisfy the two-unit rule through `NE-S01` plus `NEI121`. Quick and Standard omit the criterion.

The accepted scholarly basis is Robert Shaver's *Egoism*, Sections 1-3. That source distinguishes ethical egoism from psychological and rational egoism and presents the standard act formulation as a maximizing if-and-only-if account, while noting variants: <https://plato.stanford.edu/entries/egoism/>.

### Unresolved distinction

The active model has no proposition stating that an act is morally right if and only if it best advances the agent's own good. `construct-NE16` is about practical rationality, not moral rightness, and is absent from all three active routes. Reusing it would collapse moral and rational egoism.

### Disposition

Promote only a scoped internal comparison, `ethical-egoism-exclusive-self-priority-scoped`, mapped exactly to `construct-NE15` on Full. Keep the standard maximizing rightness criterion, the account of welfare, and nonstandard rule/character variants explicitly unmeasured. Do not present the scoped comparison as a complete Ethical Egoism identity.

No new active item is justified for this release. A direct maximizing-rightness item could be authored, but doing so would require a new bank/model/route release and a reviewed independent evidence design. Adding it merely to clear a readiness state would be model-driven overfitting.

## Ayn Rand and Objectivism

### Exact and partial active coverage

The readiness audit identifies one exact core mapping and three partial neighboring mappings.

| Candidate claim | Active proposition | Mapping | Relevant active evidence | Route availability |
|---|---|---|---|---|
| life-grounded objective ethics | `construct-ME09` | exact | `MEI100@1`, `MEI101@1`, `MEI102@1` | Full |
| rational self-interest within Rand's system | `construct-NE15` | partial | `NEI100@1`, `NEI121@1` provide the two active units | Full |
| perceptual epistemology | `construct-EP20` | partial | `EPI115@1`, `EPI116@1`, `EPI117@1` | Full |
| Rand-grounded individual rights | `ph-rights-constraints` | partial | `PLI008@1`, `PLI052@1` | Quick, Standard, Full |

`construct-ME09` asks whether requirements of human life and flourishing ground objective moral standards, separately from mere biological description or current preference. Rand's *The Objectivist Ethics* explicitly makes life and the requirements of human life the standard of value: <https://courses.aynrand.org/works/the-objectivist-ethics/>. The accepted scholarly source, Badhwar and Long's *Ayn Rand*, likewise places this thesis inside a wider ethical and philosophical system: <https://plato.stanford.edu/entries/ayn-rand/>.

The other three active propositions are genuinely adjacent but broader. `NE15` does not encode Rand's life-grounded account of rational self-interest. `EP20` is a generic external-world experiential-warrant proposition, not Rand's theory of perception and concepts. `ph-rights-constraints` tests rights against aggregate benefit, not Rand's derivation of rights from rational agency and the conditions of human life. Their route availability does not repair those semantic gaps.

### Disposition

Do not promote Objectivism as a system. Promote only `ayn-rand-life-grounded-ethics-scoped`, a one-claim internal philosopher comparison mapped to the exact `construct-ME09` criterion on Full. Leave rational self-interest, epistemology, rights, metaphysics, and wider political doctrine explicitly unmeasured.

No single new item could make the coordinated Objectivist system ready. Repairing the remaining gaps would require several distinct propositions and evidence units, so adding a token discriminator here would overstate coverage.

## John Stuart Mill

### Active neighboring propositions

The current audit maps Mill only partially:

| Candidate claim | Active proposition | Mapping | Active evidence | Route availability |
|---|---|---|---|---|
| greatest-happiness principle | `reviewed-NE25-total-welfare-maximization` | partial | `NEI133@1`, `NEI125@2` | Full |
| direct act-consequence reading | `reviewed-NE22-act-consequence-criterion` | partial | `NEI122@1`, `NEI014@1` | Full |

`reviewed-NE25-total-welfare-maximization` is deliberately narrower and stronger than a generic utility standard: it requires total well-being to decide individual-act rightness in a specified promise conflict. `reviewed-NE22-act-consequence-criterion` distinguishes direct act consequences from rule criteria. The separate `reviewed-NE24-welfarist-outcome-value` proposition concerns what makes outcomes good in themselves and does not supply a criterion of moral rightness.

Mill's *Utilitarianism*, Chapter II, gives the Greatest Happiness Principle as the foundation of morals and says actions are right in proportion as they promote happiness. The accepted scholarly literature, however, does not make the act-versus-rule interpretation trivial. The Stanford Encyclopedia's Mill and utilitarianism discussions distinguish Mill's general utility standard from competing direct and rule-focused reconstructions: <https://plato.stanford.edu/entries/mill/> and <https://plato.stanford.edu/entries/utilitarianism-history/>.

### Disposition

Do not add a Mill reference profile in this release. Mapping Mill directly to `NE25` would import the active model's individual-act maximizing promise criterion into a source claim that is broader and interpretively contested. Mapping him directly to `NE22` would make the disputed act/rule reading a required profile commitment.

A new interpretation-neutral "general happiness as ultimate moral standard" proposition would require its own independently discriminating evidence units. There is no exact existing pair to remap, and adding a single unpaired item solely to make Mill profile-ready would not satisfy the project's evidence rules. The distinction therefore remains unresolved.

## Release decision

Reference-profile catalog 1.1.0 adds exactly two scoped internal comparisons:

1. `ethical-egoism-exclusive-self-priority-scoped` using only `construct-NE15`.
2. `ayn-rand-life-grounded-ethics-scoped` using only `construct-ME09`.

Mill remains unprofiled. The broader three readiness candidates remain `PARTIAL_PROFILE_ONLY`, which is intentional: authoring a narrower comparison does not erase the candidate-level gaps.

The 1.0.0 reference catalog remains immutable. Version 1.1.0 remains `internal_only`, keeps `identityOutputAllowed: false` and `percentageMatchAllowed: false`, and is not added to `data/current.json`. Route omission remains `not_measured`. No winner, nearest-profile, similarity, aggregate-score, or percentage semantics are introduced.

## Post-PR #37 follow-up: interpretation-neutral Mill evidence design

A source-first follow-up at main `03169ee9bf346473ae4e1e6ff33f307f61d770d2` confirms that the unresolved Mill distinction is real rather than a missing remap. Mill's *Utilitarianism*, Chapter II, supports a first-principle claim about general happiness as the ultimate moral standard while also discussing subordinate or secondary principles. The current scholarly literature distinguishes that first principle from disputed direct-act, rule, and other indirect reconstructions.

The governed design in [`docs/plan/mill-general-happiness-v1/research-design.md`](plan/mill-general-happiness-v1/research-design.md) therefore reserves `NE26` for this future exact proposition:

> General happiness is the ultimate moral standard: moral rules, duties, and judgments are ultimately justified or resolved by their relation to the general happiness, without requiring that standard to be applied directly to each individual act.

The design proposes two distinct future Full-only evidence units, `NEI134@1` and `NEI135@1`, and fixes the required positive, negative, mixed, one-unit, missing, false-positive-neighbor, act/rule-neutrality, source-trace, route-omission, historical, and reference-profile-gate regressions before implementation. See [the regression design](plan/mill-general-happiness-v1/regression-design.md) and under-review proposal `MCP-2026-094`.

This is a design record, not active evidence. Neither item, `NE26`, nor `reviewed-NE26-general-happiness-ultimate-standard` exists in the active 0.19.0 / 1.16.0 / 2.7.0 release. The current catalog must therefore continue to contain no Mill profile. Promotion becomes eligible for separate review only after a successor release contains both direct evidence units, guarantees them on Full, resolves the rule's claim-level sources, and passes the governed regressions. NE22, NE23, NE24, and NE25 remain neighboring propositions and must not substitute for that direct evidence.

