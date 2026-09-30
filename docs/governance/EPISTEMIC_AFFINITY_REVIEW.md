# Scoped epistemic affinity review

**Release:** [model 1.6.0](../../data/releases/model-release-v1.6.0.json). The release adds two subject-scoped comparisons to the [versioned catalog](../../data/affinities/catalog-v1.4.json). It adds no questions, changes no answer-to-evidence mapping, and makes no claim that a respondent *is* a member of either tradition.

## Source and proposition boundaries

| Comparison | Defining doctrine mapped to an interpreted proposition | Exact existing items | Public opportunity |
| --- | --- | --- | --- |
| Fallible knowledge | A claim can count as knowledge even when its justification leaves open a possibility of error. `construct-EP15` | `EPI100@1`, `EPI101@1`, `EPI102@1` | Standard and Full; Quick leaves it `not_measured`. |
| Experience grounded external-world knowledge | Knowledge claims about concrete external reality ultimately require experiential evidence; reasoning alone cannot establish new external-world facts. `construct-EP20` | `EPI115@1`, `EPI116@1`, `EPI117@1` | Full; Quick and Standard leave it `not_measured`. |

The [IEP entry on fallibilism](https://iep.utm.edu/fallibil/) supports the distinction between knowledge with nonconclusive justification and skepticism. The items ask whether fallible justification can sometimes suffice; they do **not** establish the stronger thesis that every belief in every domain lacks conclusive justification. Mere willingness to revise an opinion is a neighboring view, not substitute evidence. Pragmatism additionally asks how conceivable consequences clarify ideas; fallibilism alone never supplies that criterion.

The [SEP account of rationalism and empiricism](https://plato.stanford.edu/entries/rationalism-empiricism/) explicitly treats the dispute as relative to a subject area and warns against pure historical types. The released comparison is limited to concrete external-world facts. Trust in scientific institutions or public testing alone does not establish this source-of-knowledge thesis. Reasoning can organize experiential evidence. The comparison does not infer a view about mathematical, moral, or all conceptual knowledge, nor atheism or physicalism.

Each public rule now pins an exact proposition and a rule-linked academic claim. The [source registry](../../data/sources-v1.2.json) and [claim ledger](../../data/generic/source-ledger-v0.8.json) record which items, constructs, and rules use those claims. The claims explain conceptual interpretation; they do not validate the original item wording or establish psychometric factors. The [review proposals](../../data/governance/proposals/MCP-2026-029.json) and [regression](../../scripts/test-epistemic-affinity-release.mjs) cover positive, negative, mixed, missing, route-omitted, and near-neighbor patterns.

## Preservation and remaining limits

The 64/120/240 item IDs, revisions, and order are unchanged. New route and client versions bind the catalog, source claims, and executable replay snapshot without editing the 1.5 release. English uses the canonical source text. Spanish and Arabic comparison wording remains untranslated and unavailable for public administration. Characteristic and disputed criteria in both new comparisons remain visibly unmeasured instead of being inferred from adjacent rules.

The two groups each contain three closely related agreement items. Their authored evidence units are duplication controls, not proof of independent response information. Human comprehension and item behavior remain open empirical questions.
