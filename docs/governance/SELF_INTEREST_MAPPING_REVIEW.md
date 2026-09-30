# Normative self-interest mapping: preliminary content review

Status: editorial analysis and synthetic software preview, not an approved rule, item, or affinity change. Draft proposal `MCP-2026-005` and candidate `NEI121@1` are unreleased. The frozen `model-release-1.0.0` and `philosophical-affinity-1.0.0` remain unchanged.

## Current inference and reuse

Public rule `construct-NE15` has no stored standalone `proposition`; its `scope` is a universal moral prescription to prioritize one's own good. The catalog maps that rule directly to the defining `ethical-egoism/moral-self-interest` and `objectivism-rand/rational-self-interest` criteria. One respondent answer pattern can therefore create overlap with two distinct doctrines, while the rest of each tradition's defining criteria must remain separately assessed. The rule is not a psychological claim about what people actually want or do.

| Mapped item | In frozen 238-item route? | Direction recorded by the rule | Content issue |
| --- | --- | --- | --- |
| `NEI100@1` | Yes | Agreement supports; disagreement opposes. | Explicitly prescribes each person's own long-term flourishing as an ultimate moral end. |
| `NEI101@1` | Yes | Agreement supports; disagreement opposes. | Restates the universal own-good final aim in similar wording. Two agreements alone currently satisfy the two-unit threshold, but their independence is untested. |
| `NEI102@1` | **No** | Disagreement would support; agreement would oppose if a future route administered it. | Agreement distinguishes permissible self-concern from an ultimate universal standard. Disagreement does not uniquely endorse ethical egoism: a respondent might deny that self-concern is permissible at all. The reverse-keyed sentence also combines permissibility and ultimate-standard claims. It supplies no evidence to the current pilot. |

The synthetic preview in `scripts/test-pilot-v1.mjs` keeps the released outcome visible: agreement with `NEI100` and `NEI101` is `supported`. Giving those two items one authored evidence unit makes the rule `not_measured` for the current route, because `NEI102` was not administered and only one support/opposition unit remains available. This preview is a software sensitivity check, not a claim about empirical dependence or participant comprehension. The present catalog's defining overlap can therefore rest entirely on two similarly worded questions, without a contrary-direction discriminator in the route.

## Philosophical boundary

[Shaver's SEP account of egoism](https://plato.stanford.edu/entries/egoism/) distinguishes descriptive psychological egoism, ethical egoism's moral requirement, and rational egoism's broader practical requirement. Its standard ethical-egoism formulation ties right action to maximizing the agent's self-interest, while acknowledging less common variants. The two administered pilot items address a narrower universal moral aim; they do not ask the full if-and-only-if or maximizing criterion. A self-regarding prerogative, permission for personal projects, or refusal of severe sacrifice does not by itself supply that missing criterion.

[Badhwar and Long's SEP account of Rand](https://plato.stanford.edu/entries/ayn-rand/) places rational self-interest within a larger system and describes scholarly disagreement over its ultimate value. [Rand's own ethics essay](https://courses.aynrand.org/works/the-objectivist-ethics/) ties one's life as an end to a specific standard of rational human life, not to whatever one happens to desire. `NEI100` speaks of long-term flourishing, but these answers do not distinguish Rand's account from other normative self-interest views. The catalog's separate ethics, epistemology, metaphysics, and political criteria therefore cannot be filled by `NE15` or by market preference.

Likely neighboring positions to test are: duties of self-care plus independent duties to others; agent-centered prerogatives; rational egoism without the claim that the requirement is moral; psychological egoism without any normative endorsement; and, for any future use of `NEI102`, a non-egoist who rejects its permissibility premise. None should be silently classified as ethical egoism or Objectivism from this rule alone.

## Decision needed for a future release

1. Review the exact narrow proposition that these items could support and retain it in the versioned rule with claim-level academic provenance. Do not equate the current scope label with the stronger standard ethical-egoism thesis.
2. Review the two administered items for likely semantic redundancy. Review `NEI102` for the two distinct reasons a respondent may disagree before any future route includes it. Cognitive interviews and later response-pattern analysis can test these concerns; authored unit IDs are not empirical independence evidence.
3. The existing-bank review found that `NEI012` concerns **very large** sacrifices and cannot alone distinguish egoism from many non-egoist limits on demandingness. `NEI118`/`NEI119` distinguish voluntary concern from a universal duty in the nearby ownness topic. `NEI021` concerns aggregate good, while `NEI105` asks for a practical reason rather than a moral reason. None asks whether another person's serious need gives an independent moral reason at modest cost. The unreleased `NEI121@1` vignette offers four responses: independent duty, independent but non-obligatory moral reason, exclusive own-good moral reason, and undecided. Its premise stipulates no gain to one's long-term good. That premise and the distinction between a reason and a duty need philosophical and respondent comprehension review; the SEP does not validate the wording.
4. If a revised rule or item is released, preserve all three historical item revisions and the original model. Submit a rule proposal, and a separate criterion proposal if doctrinal mapping changes; include support, opposition, mixed, missing, false-positive neighbor, and historical fixtures. Keep the stronger if-and-only-if ethical-egoism criterion unmeasured until directly discriminating evidence exists.

This note does not infer psychometric validity or recommend identifying a respondent with either tradition. It identifies where the current authored comparison needs stronger content evidence.

## Unreleased successor preview

The synthetic `NE15` successor fixture states the narrow proposition explicitly, counts `NEI100@1` and `NEI101@1` as one authored evidence unit, excludes ambiguous `NEI102@1` from that rule, and adds `NEI121@1` only to a temporary candidate bank and route. It checks supporting, opposing, mixed, undecided, missing, near-paraphrase, route-omission, and historical behavior. Two agreements with `NEI100` and `NEI101` yield only a lean in the candidate route and `not_measured` if the draft item is not part of that route. The frozen result remains `supported` under its own version. This is an implementation sensitivity test, not evidence that respondents interpret `NEI121` as intended or that its authored unit is empirically independent.

The candidate is supported by [Shaver's SEP distinction between egoism's descriptive, moral, and practical forms](https://plato.stanford.edu/archives/spr2021/entries/egoism/) and its discussion of uncompensated aid. That source supports the philosophical contrast; it does not establish this item's content validity, threshold, or an Objectivist affinity. Keep the catalog's defining criteria under separate review and leave the full maximizing account unmeasured.
