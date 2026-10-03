# Frozen pilot evidence dispositions

This is the current content-opportunity audit for `generic-1.16.0-pilot` and the 249-item `full-2.7.0` route in model release 1.19.0. The [machine-readable disposition](../data/reviews/pilot-evidence-dispositions-v17.json) records each affected rule, exact assigned and omitted item revisions, evidence-unit counts, source IDs, Full-route scope, and reconciliation with the [older 35-gap route review](../data/reviews/route-review-v1.json). Rebuild with `node scripts/audit-pilot-evidence.mjs --active --write`; CI checks it with `--active --check`. Earlier artifacts remain pinned. Model release 1.19.0 added two Full-route questions (`ECI001@2` and `ECI002@2`) for a scoped worker-control economic authority criterion (`reviewed-EC01-social-control`), bringing Full to 249 items while Quick and Standard remain unchanged at 64 and 120. The addition created one additional complete Full evidence path (reaching 97 assessable direct rules), while 50 direct public rules remain `not_measured` by the 249-item route.

## What the current route can claim

The candidate bank contains 575 authored items (`candidate-v0.19.json`). The versioned Full route assigns 249 exact revisions. Of 147 public direct rules, 97 have at least two assigned authored evidence units capable of support **and** at least two capable of opposition. This is evidence opportunity, not a guaranteed respondent result: neutral, no-view, uncomprehended, missing, and contradictory answers retain their own handling. The other 50 public direct rules remain `not_measured` by this route.

| Current Full-route gap class | Rules | Disposition |
| --- | ---: | --- |
| Route omits existing bank items | 37 | Items exist in candidate bank with complete 2-support and 2-oppose units, but Full route assigns none of them. |
| Assigned evidence directionally incomplete | 2 | Partial evidence assigned on Full (1 support, 1 oppose), but 1 additional bank item is omitted by route. |
| Entire bank lacks required opposing units | 11 | Bank directional gap: bank has 2 support but <2 oppose units. Cannot be repaired by route edits alone. |

## Research backlog: ranking the 50 Full-route gaps

The 50 gaps fall into three distinct repair categories:

### Tier 1: Route-near completion (2 rules)

These two rules are already 50% assigned on Full (1 support unit, 1 oppose unit). Each needs only **one** additional existing bank item admitted to Full to satisfy the 2-support / 2-oppose threshold:

1. **`instrumental-harm`** (`NE08`, headline): "Instrumental harm can be permissible" (Trolley / double-effect / consequentialist constraints). Currently assigns `NEI005@2` (1 support, 1 oppose). Omitted item `NEI030@1` completes the contract (giving 2 support, 2 oppose).
2. **`moral-limits-validity`** (`PL21`, diagnostic): "Extreme injustice may undermine legal status" (Natural law vs. legal positivism / Radbruch formula). Currently assigns `PLI014@2` (1 support, 1 oppose). Omitted item `PLI072@1` completes the contract (giving 2 support, 2 oppose).

### Tier 2: Bank-ready route admissions (37 rules)

All 37 rules have fully viable 2-support and 2-oppose authored evidence paths in the candidate bank (59 total distinct bank items), but are omitted entirely from the 249-item Full route. Ranked by philosophical tradition impact and core doctrinal distinctions:

#### A. Core political philosophy & rights foundations (12 rules)
- **`noninterference`** (`PL06`): Negative liberty (Berlin, Mill; harmless choice). Bank items: `PLI007`, `PLI051` (2 sup, 2 opp).
- **`nondomination`** (`PL07`): Republican liberty (Pettit, Skinner; uncontrolled power). Bank items: `PLI010`, `PLI057` (2 sup, 2 opp).
- **`construct-PL27`** (`PL27`): Preinstitutional rights grounding (Locke, Nozick; natural rights). Bank items: `PLI100`, `PLI101`, `PLI102` (3 sup, 3 opp).
- **`construct-PL28`** (`PL28`): Institutional/instrumental rights justification (Bentham, Mill, Raz). Bank items: `PLI103`, `PLI104`, `PLI105` (3 sup, 3 opp).
- **`construct-PL29`** (`PL29`): Territorial monopoly of final legal force (Weberian state definition). Bank items: `PLI106`, `PLI107`, `PLI108` (3 sup, 3 opp).
- **`construct-PL32`** (`PL32`): Institutional state-abolition preference (Anarchist institutional stance). Bank items: `PLI115`, `PLI116`, `PLI117` (3 sup, 3 opp).
- **`ph-democratic-authorization`** (`PL04`): Participation adds to political legitimacy. Bank items: `PLI006`, `PLI027` (2 sup, 2 opp).
- **`procedural-justice`** (`PL16`): Independent weight of fair procedures (Rawls). Bank items: `PLI015`, `PLI062` (2 sup, 2 opp).
- **`substantive-justice`** (`PL17`): Fair procedure can leave an unjust outcome. Bank items: `PLI016`, `PLI063` (2 sup, 2 opp).
- **`ph-desert-punishment`** (`PL18`): Retributive desert without future benefit. Bank items: `PLI017`, `PLI064` (2 sup, 2 opp).
- **`ph-national-obligations`** (`PL23`): Special obligations from national membership. Bank items: `PLI021`, `PLI068` (2 sup, 2 opp).
- **`ph-religious-public-law`** (`PL26`): Religious authority independently grounding public law. Bank items: `PLI023`, `PLI070` (2 sup, 2 opp).

#### B. Normative ethics & moral agency (6 rules)
- **`character-counts`** (`NE03`): Character in moral assessment (Virtue ethics). Bank items: `NEI003`, `NEI027` (2 sup, 2 opp).
- **`relational-care`** (`NE04`): Care relationships generating moral reasons (Care ethics). Bank items: `NEI006`, `NEI028` (2 sup, 2 opp).
- **`ph-special-obligations`** (`NE09`): Additional duties from close relationships (Associative duties). Bank items: `NEI024`, `NEI033` (2 sup, 2 opp).
- **`construct-NE16`** (`NE16`): Rational egoism about practical reasons. Bank items: `NEI103`, `NEI104`, `NEI105` (3 sup, 3 opp).
- **`construct-NE21`** (`NE21`): Elective other-regarding concern (Supererogation). Bank items: `NEI118`, `NEI119`, `NEI120` (3 sup, 3 opp).
- **`ph-high-sacrifice`** (`NE11`): Major sacrifice required by very large benefits (Demandingness). Bank items: `NEI012`, `NEI035` (2 sup, 2 opp).

#### C. Epistemology & scientific method (6 rules)
- **`ph-belief-revision`** (`EP01`): Contrary evidence reopening beliefs (Peircean fallibilism). Bank items: `EPI001`, `EPI023` (2 sup, 2 opp).
- **`ph-observation-weight`** (`EP04`): Observation weight against theory (Empiricism). Bank items: `EPI003`, `EPI016` (2 sup, 2 opp).
- **`ph-intuitive-warrant`** (`EP09`): Initial warrant of intuition (Phenomenal conservatism). Bank items: `EPI011`, `EPI031` (2 sup, 2 opp).
- **`ph-scientific-realism`** (`EP13`): Reality of unobservables in successful science. Bank items: `EPI013`, `EPI033` (2 sup, 2 opp).
- **`construct-EP17`** (`EP17`): Concepts as revisable instruments of inquiry (Pragmatism/Instrumentalism). Bank items: `EPI106`, `EPI107`, `EPI108` (3 sup, 3 opp).
- **`construct-EP19`** (`EP19`): Contextual certainty (Epistemic contextualism / hinge certainty). Bank items: `EPI112`, `EPI113`, `EPI114` (3 sup, 3 opp).

#### D. Metaphysics & ontology (2 rules)
- **`natural-world`** (`OM01`): Naturalism about reality. Bank items: `OMI009`, `OMI011` (2 sup, 2 opp).
- **`physical-reality`** (`OM02`): Physicalism about fundamental reality. Bank items: `OMI002`, `OMI012` (2 sup, 2 opp).

#### E. Schwartz value priorities (11 rules)
- `priority-VA01` (Thought), `priority-VA03` (Stimulation), `priority-VA07` (Resources), `priority-VA08` (Face), `priority-VA09` (Personal security), `priority-VA10` (Societal security), `priority-VA12` (Rule conformity), `priority-VA13` (Interpersonal conformity), `priority-VA14` (Humility), `priority-VA17` (Universalist concern), `priority-VA19` (Universalist tolerance).

### Tier 3: Bank directional contract gaps (11 public rules + 5 research rules)

These 11 public rules cannot be solved by route expansion alone: the candidate bank itself lacks the required opposing evidence units. Each requires authoring new contrasting item revisions or revising rule directional semantics:

1. **`legacy-objectivism-moral-truth-aptness`** (`ME06`): Bank has 2 sup, 1 opp.
2. **`mutual-advantage`** (`NE06`): Bank has 2 sup, 1 opp.
3. **`ph-basic-experience`** (`MS02`): Bank has 2 sup, 1 opp.
4. **`ph-desire-welfare`** (`VA20`): Bank has 2 sup, 0 opp.
5. **`ph-doing-allowing`** (`NE12`): Bank has 2 sup, 1 opp.
6. **`ph-functional-minds`** (`MS02`): Bank has 2 sup, 1 opp.
7. **`ph-noncosmic-meaning`** (`EX01`): Bank has 2 sup, 1 opp.
8. **`ph-objective-welfare`** (`VA20`): Bank has 2 sup, 1 opp.
9. **`ph-particular-judgment`** (`ME04`): Bank has 2 sup, 1 opp.
10. **`ph-political-cosmopolitanism`** (`PL22`): Bank has 2 sup, 1 opp.
11. **`ph-strong-property`** (`PL11`): Bank has 2 sup, 1 opp.

The [exact-item semantic review](../data/reviews/directional-contract-decisions-v1.json) covers all 16 directional gaps (11 public + 5 research): each retains its non-directional public behavior until a separately versioned item or rule revision can support an exact proposition. The engine refuses to emit `supported`, `opposed`, or a lean for any rule without a viable two-direction assigned path.

## Earlier 35 bundled-path gaps

The earlier audit concerned legacy `audit-*` rules and a sampled 240-item route. Under the current construct dispositions:

| Relationship to current model | Earlier gaps | Meaning |
| --- | ---: | --- |
| Related public successor rule has a complete Full-route path | 14 | The current route has an assigned path for the successor. |
| Narrower or split public successor has a complete path | 2 | The old broader inference does not transfer. |
| Successor rule is nonpublic | 2 | Public omission is intentional. |
| No successor direct rule | 16 | Preserves unresolved, split, or other construct audit dispositions. |
| SO09 reopened and retired | 1 | Distinct moral-scope propositions; unresolved. |

## Item wording follow-up

`SOI029@1` and `PLI067@1` put an equal-weight position in alternative B while their shared `paired5` scale also labels the midpoint “Neither / equal.” A respondent's midpoint therefore has an ambiguous relation to B. SO09 no longer has a public rule, and the political-cosmopolitanism rule remains structurally `not_measured`; neither answer is promoted to a direct equality conclusion. These items remain revision candidates for a successor instrument.
