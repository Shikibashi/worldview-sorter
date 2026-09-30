# Frozen pilot evidence dispositions

This is the current content-opportunity audit for `generic-1.2.0-pilot` and the 238-item `full-1.2.0` route in model release 1.4.0. The [machine-readable disposition](../data/reviews/pilot-evidence-dispositions-v2.json) contains every affected rule, exact assigned and omitted item revisions, evidence-unit counts, source IDs, the explicit Full-route scope, and the reconciliation with the [older 35-gap route review](../data/reviews/route-review-v1.json). Rebuild with `node scripts/audit-pilot-evidence.mjs --current --write`; CI checks the current artifact with `--current --check`. The version 1 report remains pinned for the prior release.

## What the current route can claim

The bank still has 562 current candidate items. The frozen Full route assigns 238 exact revisions. Of 140 public direct rules, 90 have at least two assigned authored evidence units capable of support **and** at least two capable of opposition. This is opportunity, not a guaranteed respondent result: neutral, no-view, uncomprehended, missing, and contradictory answers retain their own handling. The other 50 remain `not_measured` by this route.

| Current Full-route gap | Rules | Disposition |
| --- | ---: | --- |
| No mapped evidence item assigned | 37 | Keep outside the frozen pilot's inference scope. Review existing bank items only for a separately versioned successor route when the added distinction justifies burden and displacement. |
| Some content assigned, but a directional path is incomplete | 2 | Keep `not_measured`; examine the exact missing item revisions before any successor route change. |
| The entire bank lacks the required opposing evidence units | 11 | Keep `not_measured`; a route edit alone cannot repair the two-direction contract. Review item meaning or rule scope in a new model version. This category takes precedence even when the Full route also omits those items. |

The 11 structurally unavailable public rules are `legacy-objectivism-moral-truth-aptness`, `mutual-advantage`, `ph-basic-experience`, `ph-desire-welfare`, `ph-doing-allowing`, `ph-functional-minds`, `ph-noncosmic-meaning`, `ph-objective-welfare`, `ph-particular-judgment`, `ph-political-cosmopolitanism`, and `ph-strong-property`. Five further research-tier rules have the same whole-bank directional problem but cannot enter public results. These are authored mapping defects, not observations about respondents. The [exact-item semantic review](../data/reviews/directional-contract-decisions-v1.json) now covers **all 16** gaps: each retains its current non-directional public behavior until a separately versioned item or rule can support an exact proposition. For example, attitude expression can coexist with some accounts of moral truth-talk ([SEP, Moral Cognitivism vs. Non-Cognitivism](https://plato.stanford.edu/entries/moral-cognitivism/)); equal wrongdoing in one doing/allowing case does not establish a general view of that distinction ([SEP, Doing vs. Allowing Harm](https://plato.stanford.edu/entries/doing-allowing/)); and giving compatriots some priority does not settle every version of cosmopolitan concern ([SEP, Cosmopolitanism](https://plato.stanford.edu/entries/cosmopolitanism/)). The research-only epistemic theory choices also cannot be treated as denials of all neighboring theories ([SEP, Coherentism](https://plato.stanford.edu/entries/justep-coherence/), [SEP, Foundationalism](https://plato.stanford.edu/entries/justep-foundational/)). These sources clarify neighboring theories; they do not validate the original questionnaire items. The current engine refuses to emit `supported`, `opposed`, or a lean for a rule without a viable two-direction assigned path. A future rule may legitimately be directional only in one sense, but that needs an explicit, sourced proposition and versioned semantics; the opposite must not be manufactured to make counts symmetric.

Model release 1.3.0 adds internal opportunity reasons to new results: `route_omission` for too few assigned units, `branch_not_reached` when an assigned conditional path was skipped, and `unavailable_in_instrument` when the whole bank lacks the authored two-direction path. A no-view answer after an adequate opportunity remains `insufficient_evidence`. The release pins `engine-source-1.1.0`; earlier release manifests and executable archives remain unchanged. Facet and domain result objects now report `not_measured`, `partially_assessed`, `assessed_unresolved`, or `meaningfully_assessed` from their public rows. These are descriptive content states, not psychometric coverage estimates.

## Earlier 35 bundled-path gaps

The earlier audit concerned `audit-*` rules and a sampled 240-item route. It cannot be read as a list of 35 active Full-route misses now. Under the successor construct dispositions:

| Relationship to current model | Earlier gaps | Meaning |
| --- | ---: | --- |
| Related public successor rule has a complete Full-route path | 14 | The current route has a path for the successor. Rule IDs and propositions remain version specific. |
| Narrower or split public successor has a complete path | 2 | The old broader inference does not transfer. Only the current narrower rule can be interpreted. |
| Successor rule is nonpublic | 2 | Public omission is intentional. |
| No successor direct rule | 16 | Preserve the construct audit's unresolved, split, or other gap disposition. |
| SO09 reopened and retired | 1 | The two items tested distinct moral-scope propositions; the new model leaves SO09 unresolved. |

This is an explicit disposition, not a claim of full philosophical coverage. `not_measured` remains the correct Full-route state when the assigned content cannot meet the authored contract. Earlier item revisions and released route policies remain unchanged. No statistical local dependence, item information, reliability, or validity is inferred from this content audit.

## Item wording follow-up

`SOI029@1` and `PLI067@1` put an equal-weight position in alternative B while their shared `paired5` scale also labels the midpoint “Neither / equal.” A respondent's midpoint therefore has an ambiguous relation to B. SO09 no longer has a public rule, and the political-cosmopolitanism rule remains structurally `not_measured`; neither answer is promoted to a direct equality conclusion. These items are revision candidates for a successor instrument. Their released wording and historical responses remain intact.
