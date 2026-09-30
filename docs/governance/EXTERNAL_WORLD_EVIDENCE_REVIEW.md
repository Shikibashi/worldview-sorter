# Ordinary external objects: EP11 evidence review

**Status:** editorial draft. `EPI119@1` is an unreleased candidate; the frozen pilot rule, item bank, routes, and respondent results are unchanged.

The frozen `audit2-EP11-external-world` rule infers the exact proposition “Ordinary perceived objects exist independently of minds.” That is a claim about ordinary objects, not about whether perception is direct or whether beliefs based on perception are certain. The [SEP account of perceptual epistemology](https://plato.stanford.edu/archives/win2020/entries/perception-episprob/) separates questions about perceptual justification from the metaphysics of perceiving a mind-independent world. The [SEP account of the problem of perception](https://plato.stanford.edu/archives/spr2011/entries/perception-problem/) explains that indirect realists can affirm mind-independent objects, while idealists deny that ordinary material objects have that independence. The [SEP discussion of metaphysical realism](https://plato.stanford.edu/entries/realism-sem-challenge/) also warns against treating the existence of mind-independent objects as scientific realism or as a claim that all experienced qualities are mind-independent. These sources define nearby philosophical views; they do not validate Worldview Sorter's questions or its two-unit threshold.

## Existing response evidence

| Item | Current EP11 meaning | Content concern |
| --- | --- | --- |
| `EPI036@1` | Agreement supports; disagreement opposes. | It states object independence **and** sensory mediation. A respondent could reject the mediation clause without rejecting ordinary objects. |
| `EPI037@1` | `mind_independent` supports; other options are non-directional. | The positive option states the target directly. Its agreement with `EPI036` may repeat one idea rather than supply a distinct content facet. `partly_mind_dependent` cannot safely be counted as opposition because it leaves something external. |
| `EPI034@1` | `idealist` opposes; direct, indirect, and skeptical choices are non-directional. | This appropriately avoids treating indirect perception or skepticism about perceptual proof as denial of external objects. |
| `EPI035@1` | No EP11 directional evidence. | Its simulation case concerns whether experience can establish knowledge of an external world, not whether ordinary objects exist independently of minds. |

The frozen rule reports `supported` when `EPI036` is agreed with and `EPI037` chooses `mind_independent`. The two answers are distinct responses, but both explicitly affirm ordinary-object independence. Their independence as evidence units is an **authored assumption**, not an empirical finding. A source-linked exact proposition alone would not fix this content issue.

## Unreleased candidate and preview

[`EPI119@1`](../../data/items/external-world-draft-v1.json) presents misleading appearances and asks what, if anything, persists beyond them. Its `independent_rock` option would support the proposition; `no_independent_object` would oppose it. `external_but_conceptualized` and `undecided_by_case` remain non-directional: partial conceptual dependence and caution about what a case proves are not equivalent to denying an object. The scenario does not ask respondents to choose direct versus indirect perception.

The synthetic successor preview in [`test-pilot-v1.mjs`](../../scripts/test-pilot-v1.mjs) removes `EPI036` from this rule and adds `EPI119` as a different authored unit alongside the general `EPI037` choice. It shows positive, opposed, mixed, leaning, missing, neighboring-view, and route-omission behavior. The old `EPI036` + `EPI037` pair still returns its frozen historical `supported` state, but yields only a lean in the preview. This is a software and content-contract check, **not** evidence of item independence, comprehension, or philosophical validity.

Reviewers must assess whether the new case genuinely elicits a distinct response process rather than another paraphrase. In particular, `external_but_conceptualized` may appeal to a realist who thinks object categories depend partly on concepts, and `undecided_by_case` may appeal to a realist who merely denies that perceptual error proves existence. Those responses must not be scored as opposition. Check how respondents understand “independently of experience,” the scenario's apparent error, and the difference between the rock's existence and its description. If this case does not discriminate reliably, leave EP11 unmeasured in the successor instead of restoring duplicate support units.

No new item or rule should become public by editing the frozen files. The [draft change proposal](../../data/governance/proposals/MCP-2026-004.json) records affected routes and release consequences. An accepted successor needs a new bank and instrument, an exact source claim reviewed against the proposition, route coverage checks, appropriate localization review, and a versioned model release. Historical answers and results remain available under the pilot manifest.
