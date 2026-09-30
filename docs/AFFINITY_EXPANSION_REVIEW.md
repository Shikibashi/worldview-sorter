# Affinity expansion review

This is a historical editorial screen of **51** scoped philosophical positions and traditions against `generic-1.1.0-pilot`. The [machine-readable review](../data/affinities/expansion-review-v1.json) records every disposition, relevant public rules, missing defining doctrine, nearest false positive, and academic source. It is **not** a released affinity catalog, respondent classification, or psychometric finding. Its six-entry baseline is preserved in [catalog 1.1.0](../data/affinities/catalog-v1.1.json). The current [catalog 1.2.0](../data/affinities/catalog-v1.2.json) has seven comparisons after a separate governed review of the scoped Easy Ontology method. Historical catalogs and results are unchanged.

The subsequent [question-gap review](AFFINITY_QUESTION_DRAFT.md) maps all 51 positions to exact existing item revisions and a limited unreleased draft of doctrinal discriminators. It leaves the public routes and catalog unchanged.

| Disposition | Count | Release consequence |
| --- | ---: | --- |
| Current catalog | 6 | Existing authored comparisons remain qualified by the public presentation review. |
| Candidate requiring exact claim review | 4 | Review the item meanings, add an exact rule proposition and linked supporting source claim in a new model version, then propose a new catalog version. |
| Candidate requiring item or rule review | 9 | Resolve the recorded false-positive or evidence-independence concern before any direct affinity mapping. |
| Defining doctrine absent | 32 | Retain as explicit coverage gaps. Related answers must not stand in for the missing criterion. |

## What could broaden the catalog first

At the time of this screen, four scoped positions had existing route-measured rules that plausibly bore on their defining thesis: fallibilism about knowledge, a narrow sensory empiricism about concrete external-world claims, easy ontology, and the noninferential-warrant component of foundationalism. The scoped Easy Ontology method has since received claim-level review and a versioned catalog entry; its wider doctrine remains unmeasured. Foundationalism's full regress structure remains unmeasured. The other candidates still need claim-level review under the [governance contract](governance/CONTRIBUTING.md).

Nine other candidates have concrete item or rule questions. For example, `AHI100` and `AHI101` are close statements of universal self-interested motivation; the current two-unit rule should not automatically support a psychological-egoism affinity. The deity-existence, personal-character, and intervention items can describe different referents. The positive nonstate-law items show possible provision more directly than legitimate acceptability. The EP11 ordinary-object rule and AH14 compatibility rule already have [focused](governance/EXTERNAL_WORLD_EVIDENCE_REVIEW.md) [reviews](governance/FREE_WILL_CONDITION_REVIEW.md) or proposals. These issues are item semantics and inference boundaries, not missing labels.

The catalog schema currently groups some different kinds of positions under broad scopes. Psychological egoism is a descriptive thesis, while ethical egoism is a moral prescription. Free-will compatibilism is a thesis in philosophy of action; theological agnosticism is an epistemic stance in philosophy of religion. A release that adds these needs scope vocabulary that keeps those distinctions visible. It should not treat every entry as a complete worldview.

## Important deferrals

[Consequentialism](https://plato.stanford.edu/entries/consequentialism/) asks whether consequences are the ultimate standard, and [rule consequentialism](https://plato.stanford.edu/entries/consequentialism-rule/) makes the justification of rules consequence-dependent. `outcomes-count` and `ph-rule-mediated` do not answer either defining question. [Utilitarianism](https://plato.stanford.edu/entries/consequentialism/) additionally needs the relevant welfare and aggregation commitments. [Virtue ethics](https://plato.stanford.edu/entries/ethics-virtue/) makes virtue central; valuing character is insufficient. [Contractualism](https://plato.stanford.edu/entries/contractualism/) needs its distinctive grounding of wrongness and individual-rejection reasoning.

[Moral realism](https://plato.stanford.edu/entries/moral-realism/) minimally involves truth-apt moral claims and at least some true moral claims; stance independence is disputed as an additional condition. The pilot does not establish the minimal pair, nor the semantic distinctions required to separate [error theory and noncognitivism](https://plato.stanford.edu/entries/moral-anti-realism/). [Physicalism](https://plato.stanford.edu/entries/physicalism/) is broader than a physical explanation of consciousness. Rejection of ordinary mind-independent objects does not establish [metaphysical idealism](https://plato.stanford.edu/entries/idealism/).

[Liberalism](https://plato.stanford.edu/entries/liberalism/) has substantial internal variation. [Libertarian families](https://plato.stanford.edu/entries/libertarianism/) differ over self-ownership, property, and external-resource claims. [Socialism](https://plato.stanford.edu/entries/socialism/) concerns effective social or worker control of productive assets; redistribution alone does not settle it. [Republican liberty](https://plato.stanford.edu/entries/republicanism/) centers non-domination. [Cosmopolitanism](https://plato.stanford.edu/entries/cosmopolitanism/) has moral and political variants. Existing nearby items are insufficient to infer any of these complete positions. Nor do self-created meaning, emotional restraint, or atheism establish [existentialism](https://plato.stanford.edu/entries/existentialism/), [Stoicism](https://plato.stanford.edu/entries/stoicism/), or [secular humanism](https://humanists.international/policy/declaration-of-modern-humanism/).

## Release path

1. Review each proposed rule against its exact item revisions, both answer directions, mixed and missing cases, nearest neighbors, and relevant philosophical sources.
2. Add only genuinely missing discriminating questions; version items and routes instead of rewriting the frozen pilot.
3. Use the existing proposal and release workflow for every new proposition, criterion, and tradition. New direct catalog mappings require an exact proposition and rule-linked supporting source claim. Version localization and archive the execution code if its semantics change.
4. Test each candidate with positive, negative, mixed, missing, route-omitted, and false-positive profiles. Compare old and new model releases without changing historical results.

The [review check](../scripts/test-affinity-expansion-review.mjs) verifies IDs, public and route-measured evidence references, source-ledger references, and that deferred doctrine has no asserted direct mapping. It does not certify the philosophical judgments or validate the instrument empirically.
