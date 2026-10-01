# Reference profiles

Reference profiles are an internal, claim-level exploration format. They compare a respondent's interpreted propositions with a small, source-linked set of philosophical commitments. They do not classify identity, choose a nearest philosopher, calculate similarity, or alter evidence, results, routes, or affinities.

## Current release

The current catalog pointer is [`data/reference/current.json`](../data/reference/current.json). It identifies an immutable, versioned catalog, a generated release manifest, and a generated human-readable report. The manifest pins the exact active worldview-model and progressive-route file hashes used for each profile. The catalog's profile-only source ledger is independently versioned and included in the catalog hash; none of these sources are added to the response-inference model because these profiles do not participate in response scoring. The current first batch is documented in [`reference-profiles-v1.0.0.md`](reference-profiles-v1.0.0.md).

The first catalog is intentionally internal-only. It contains five narrowly scoped comparisons: the general content-independent political-obligation criterion; the pragmatic maxim; two selected Peircean commitments; an external-world experiential-warrant criterion; and the direct maximizing act-consequence criterion. None is a complete reconstruction of a philosopher or tradition.

The active public model and affinity system remain authoritative for response interpretation. Profile claims may reference only exact active model proposition IDs. The route-aware comparison API requires the administered route: when that route did not offer a proposition, the claim is `not_measured` even if another route's report contains a state. An available proposition with missing or skipped answers remains governed by the model's own missingness state.

## Source and inference boundaries

- Primary works and signed scholarly references support claims about philosophers and traditions; they do not validate custom WVS items.
- Each claim records its proposition ID and exact active target text, expected state, doctrinal role, evidence basis, source claim, locator, neighboring views, non-entailments, limitations, and route availability.
- The inherited philosophical-anarchism comparison currently stores its target as a model `scope`, not a `proposition` field. The profile records that distinction instead of presenting the scope text as a newly versioned proposition.
- Only direct, route-available claims can enter a profile comparison. A partial or contextual claim cannot stand in for a core commitment.
- `editorial_hypothesis` is context-only and cannot be used as comparison evidence.
- A scoped comparison does not establish a larger doctrine. In particular, surface economic positions do not establish a complete philosophy, and the act-consequentialist criterion does not establish utilitarianism, welfarism, or hedonism.
- No profile is exposed through the public application. Any later public surface requires its own product review and must retain the same limitations and route context.

## Adding or revising a profile

1. State the respondent-level scope and why it is a useful comparison using Worldview Sorter's own proposition coverage. Do not use another quiz's profile or coordinates as a content source.
2. Author each claim independently from primary texts and appropriate scholarly sources. Record exact source locators, serious neighboring readings, non-entailments, and what remains unmeasured.
3. Map a claim only to an existing proposition with the same relevant meaning. If the target text, interpretation, or source meaning does not line up, leave it unmeasured or context-only; do not stretch a nearby proposition.
4. Record exact Quick, Standard, and Full availability from `assessableDirectRuleIds`. Route omission is not opposition.
5. Add a new immutable catalog file and update `data/reference/catalog-index.json` to point to it. Do not edit a released catalog, manifest, or versioned report in place.
6. Run `npm run reference-profiles:build` and `npm run test:reference-profile-catalog`. The builder fails if an existing version's manifest or report would change.

`profileModelVersion` versions this independently authored comparison content. It is separate from the worldview interpretation and affinity-catalog versions. A change in the active model or routes requires an explicit new reference-profile catalog release, because the builder verifies and pins the exact components.

## Current limitations

The catalog is a source-reviewed software/content release, not a study of respondent understanding or human similarity judgments. It does not establish philosophical consensus, empirical validity, reliability, or a person's identity. Some criteria are accessible only on Full; current Quick and Standard results must leave those profile commitments unmeasured.
