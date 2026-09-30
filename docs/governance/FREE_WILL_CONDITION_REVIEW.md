# Incompatibilist-condition interpretation review

Status: source-backed editorial analysis and draft change for a future release. The frozen pilot, its Quick and Standard routes, and historical results remain unchanged. [Proposal MCP-2026-001](../../data/governance/proposals/MCP-2026-001.json) has no approvals.

## Exact current evidence and route exposure

`construct-AH14` infers the conditional proposition that causal determinism excludes genuine free agency. It does **not** infer that determinism is true, that free will exists, or that moral responsibility requires free will. The pilot rule needs two authored units:

| Item | Agreement currently counts as | Disagreement currently counts as | Content |
| --- | --- | --- | --- |
| `AHI103@1` | Support | Opposition | A choice fixed by the whole prior state cannot be genuinely free. |
| `AHI104@1` | Support | Opposition | Freedom requires the ability to choose differently with exactly the same complete prior conditions. |
| `AHI105@1` | Opposition | Support | A determined choice can be free if it issues appropriately from the person's reasoning and capacities. |

Quick and Standard contain `AHI103@1` and `AHI104@1` but omit `AHI105@1`. Two agreements therefore produce `supported` under the frozen rule. The two questions are distinct wordings, but both principally ask whether fixed prior conditions rule out the kind of freedom at issue. Calling them two authored units does not demonstrate two independent pieces of measurement information. Full includes all three.

## Philosophical boundary

[SEP, *Arguments for Incompatibilism*](https://plato.stanford.edu/entries/incompatibilism-arguments/) defines the core dispute in terms of whether a deterministic world can contain free will and separates that conditional issue from the truth of determinism and actual possession of free will. [SEP, *Compatibilism*](https://plato.stanford.edu/entries/compatibilism/) distinguishes arguments from alternative possibilities and sourcehood; its source-incompatibilist discussion says alternative possibilities are not by themselves the whole question. [SEP, *Moral Responsibility and the Principle of Alternative Possibilities*](https://plato.stanford.edu/entries/alternative-possibilities/) describes source incompatibilist arguments that do not rely on the principle of alternative possibilities. These accounts show why rejecting the specific requirement in `AHI104` cannot, by itself, be treated as rejecting every incompatibilist condition on freedom.

`AHI104` also speaks of *freedom*, not moral responsibility. Do not silently substitute the principle of alternative possibilities for moral responsibility when interpreting its answer. `AHI105` tests a particular reasons-and-capacities compatibilist sufficient condition. Rejecting that condition supports the broad incompatibility proposition only alongside direct evidence such as `AHI103`; it does not identify the respondent as a libertarian, hard determinist, source incompatibilist, or denialist about free will.

The [Free Will Inventory development paper](https://pubmed.ncbi.nlm.nih.gov/24561311/) is evidence that free-will and determinism beliefs can be distinguished in instrument design. Its abstract does not validate these original item wordings or their duplicate-control units. Semantic overlap here is an authored content concern. Statistical local dependence and response processes require respondent data.

## False-positive and mixed cases

- `AHI103=agree`, `AHI104=agree`, `AHI105=missing` reaches `supported` on Quick and Standard using two closely related formulations. A future rule should treat this as only one direction of direct evidence unless another discriminating response exists.
- `AHI103=agree`, `AHI104=disagree`, `AHI105=disagree` can express a source-based incompatibilist who rejects a necessary-alternatives condition. The frozen rule calls this mixed; the broad conditional proposition can still receive support from `AHI103` and rejection of the compatibilist sufficient condition in `AHI105`.
- `AHI103=disagree`, `AHI105=agree` supports compatibilism with respect to the stated conditional. It does not establish belief in causal determinism.
- Missing, neutral, and `no_view` responses cannot provide directional evidence. An answer about whether the world is deterministic (`AHI002` or `AHI013`) must not substitute for the compatibility question.

## Reviewable next-version change

Keep `AHI104@1` and every historical route/model artifact resolvable. In a new versioned model, remove `AHI104` from the **broad** `construct-AH14` inference rule; retain it as a separately inspectable item target or candidate for an alternative-possibilities facet. Keep `AHI103` and `AHI105` as the two authored evidence opportunities, with explicit warning that empirical independence is unestablished. In new Quick and Standard route versions, replace `AHI104@1` with `AHI105@1` so their two rule opportunities test the conditional and a nearby compatibilist alternative. Full may retain all three for independent analysis while only two feed the broad rule.

The proposed change requires a versioned model, versioned route definitions, claim-specific source records, regression fixtures, philosophical and engineering review, and a new model release manifest. A synthetic regression may preview the intended behavior, but it must not overwrite or be advertised as historical pilot output. No new respondent item is necessary for this **narrow** correction; more discriminating questions would be needed to distinguish source incompatibilism, libertarianism, hard incompatibilism, and moral-responsibility theories.
