# Protected federal division: first governed question pair

**Release:** [model 1.5.0](../../data/releases/model-release-v1.5.0.json). **Exact respondent-facing proposition:** National and regional governments should each have constitutionally protected powers that the other cannot withdraw unilaterally. This is an authored normative proposition, not an empirically established latent trait or an identity label.

[SEP, Federalism](https://plato.stanford.edu/entries/federalism/) describes a protected division of final authority across territorial levels and distinguishes it from powers revocably delegated by a unitary center and from member-unit control of a confederation. The source supports the conceptual contrast; it does not validate these original questions. The [source registry](../../data/sources-v1.1.json), [claim ledger](../../data/generic/source-ledger-v0.7.json), and `audit-federalism` rule-linked claim preserve that limited basis.

| Evidence | Supports | Opposes | Neither direction |
| --- | --- | --- | --- |
| `PLI126@1`: general division | `entrenched` | `national_delegation` | `regional_delegation`, `case_by_case`, no view, not understood |
| `PLI127@1`: uniform national policy when regional power and equal rights protection are specified | `respect_division` | `national_override` | `regional_veto`, `other_reason`, no view, not understood |

The public rule requires both independent item units for `supported` or `opposed`. Opposite directional answers are mixed. One directional unit can only lean; presented but nondirectional or missing answers remain insufficient. Quick and Standard omit both items and therefore report `not_measured`. A conditional branch skip, if introduced in a later route, must not count as a directional answer. The [regression](../../scripts/test-federal-content-release.mjs) covers support, opposition, mixed evidence, missing evidence, confederation, localism, route omission, and historical route preservation.

Nearby positions include preference for more local administration, national delegation of regional powers, member-controlled confederation, and general constitutional obedience. The two questions do not entail that every matter should be local, that an actual constitution is just, or that a particular country should change its constitution. The second question holds rights protection constant to reduce a rights-based false positive. It remains one hypothetical case and should be tested for comprehension before anyone claims measurement reliability.

The Full route adds these two items; no old item revision or published route is rewritten. The construct's `provisional` measurement status and the seven unchanged affinity doctrines keep this comparison scoped to what the answers actually address. No new public philosophical identity follows from `PL34`.
