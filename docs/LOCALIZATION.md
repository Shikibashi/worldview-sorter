# Localization and cultural adaptation

Worldview Sorter has one authored proposition and item model. A locale bundle is a versioned **realization** of that model, not a new worldview ontology. Answer codes and evidence rules remain canonical. A localized item may use different wording, but a reviewer must confirm that it still asks the same proposition and separates the same nearby views. A material change requires a new canonical revision or a locale variant marked non-comparable until its evidence rule is reviewed.

## Current release state

| Locale | Direction | State | Respondent route |
| --- | --- | --- | --- |
| `en-US` | LTR | Approved canonical frozen English content | Quick 64, Standard 120, Full 243, and follow-up |
| `es-ES` | LTR | Untranslated review target | Unavailable |
| `ar` | RTL | Untranslated review target | Unavailable |

Spanish and Arabic exercise distinct linguistic and layout needs and have likely scholarly source material, but **no translation has been approved**. These entries are explicit gaps, not claims of Spanish or Arabic questionnaire support. No qualified linguistic/philosophical reviewer has been established in this repository. Until reviewed content and a fully localized interface are integrated, the route chooser disables these languages. It never serves an unreviewed translation or silently substitutes English. The Arabic shell is tested with synthetic direction switching; this is infrastructure QA, not Arabic content approval.

The current catalog is [`data/localization/catalog-v9.json`](../data/localization/catalog-v9.json). Historical catalogs remain at their versioned paths. Its manifest pins catalog and bundle bytes. `data/current.json` retains catalog and bundle version references; `verify:release` checks pinned hashes. New wording must use a **new file, bundle version, catalog version, and manifest**. Do not edit a released bundle in place. A saved session pins catalog and bundle versions and every assigned item's `textVersion` and optional `variantId`; restoration fails if the historical release is absent or if wording metadata changes. Pre-localization sessions remain readable as historical English with unpinned wording metadata.

## Reviewer workflow

1. Inspect the canonical item, response scale, neighboring rules, target constructs, and sources with `npm run localization:review -- --item RCI001 --locale es-ES`.
2. Record a draft in a new locale bundle with canonical item ID and revision, `textVersion`, producer, date, source note, adaptation note, review history, item/options, and `kind` (`translation`, `adapted_analogue`, or `locale_variant`). State whether the variant is `same_proposition_reviewed`, `not_comparable`, or `requires_new_revision`.
3. Review substantive philosophical wording with a fluent linguistic reviewer and a philosophical/content reviewer. Add cultural review where context matters. The schema permits one genuinely qualified person to fulfill multiple roles; each review records role, reviewer, date, and note. Grammar alone does not satisfy approval.
4. Review the entire response scale and special states. `no_view`, `not_understood`, `not_applicable`, neutral, ambivalent, and context-dependent meanings must remain distinct. Stable option IDs are checked against the canonical scale.
5. Review every result proposition, evidence-state explanation, affinity doctrine, non-entailment, and respondent-facing interface string. The current UI still has generated English copy, so non-English route availability includes `interface_integration_pending` even if isolated content records are approved. This is an explicit launch gate, not fallback copy.
6. Run `npm run localization:terms` for contextual term-consistency flags, resolve them manually, then build and test a new release. The tool never rewrites philosophy by dictionary replacement.

`npm run localization:report` lists Quick, Standard, and Full availability with missing item, scale, proposition, and affinity counts per locale. It is a release audit, not a cross-language quality score.

The [terminology review inventory](../data/localization/terminology-review-v1.json) flags contextual risks for liberty, autonomy, selfhood, rights, duty, virtue, nature, reason, objectivity, realism, community, authority, religion, and mind. It is an English source-side review checklist, **not** a set of target-language equivalents. For example, `RCI001` distinguishes personal/agent-like divinity, impersonal divinity, uncertainty, probable absence, and firm absence. A translation that collapses the first two options would change the discriminator even if its prompt sounds fluent. Political examples require special review because a policy in another jurisdiction may not bear on the same legitimacy or distributive proposition. No locale-specific item variants have yet been approved.

`sourceRealizations` can record an original title, reviewed scholarly translation, or explanatory gloss with language, source type, URL, notes, and review status. This permits target-language scholarship and original-language terminology without treating an English title as conceptually prior. Do not invent a translated title, citation, or quotation. The current non-English bundles contain no source realizations.

## Runtime and downstream behavior

`routeLocalizationAvailability` checks assigned item revisions, response scales, proposition explanations, result-state labels, affinity doctrine, and interface readiness. A missing required realization blocks that route; it cannot be filled by machine translation at request time. Clarification and route escalation reuse the pinned bundle and refuse an added item without approved wording. `localizeSummary` returns unavailable rather than fabricate missing proposition copy; affinity localization is withheld when doctrine is incomplete. It also refuses to replace a direct row's inherited-scope or source-link qualification with a generic translated evidence-state label. A future non-English result release must explicitly translate and review that qualification. The current UI admits only canonical English, so these future paths remain deliberately gated.

Share schema `worldview-share-6` pins the presentation locale and wording/catalog version, separates explicit propositions from inherited rule scopes, carries the linked interpretation state on affinity cards, and retains result-source claim roles. Share copy is presently English-only and rejects a non-English administration rather than issue a partly translated card. `worldview-share-1` through `worldview-share-5` historical cards still validate without changing their content. Research package `1.1.0` exports respondent locale, presentation locale, interface language, catalog/bundle versions, per-item text version, variant ID, and approval state alongside canonical item revisions. Historical unpinned English is marked explicitly. These fields support future comparability review; they are not evidence of nationality, ethnicity, measurement invariance, or psychometric equivalence.

The layout retains DOM reading and focus order under RTL, adds directional styles, uses script-capable system font fallbacks, and is checked at narrow width and enlarged text. A real Arabic release still needs native-language screen-reader, line-breaking, bidi, truncation, and usability review with actual translated content.

## Evidence and limits

The workflow follows the [ITC Guidelines for Translating and Adapting Tests](https://www.intestcom.org/files/guideline_test_adaptation_2ed.pdf) and [ISPOR translation and cultural-adaptation principles](https://www.ispor.org/heor-resources/good-practices/article/principles-of-good-practice-for-the-translation-and-cultural-adaptation-process-for-patient-reported-outcomes-%28pro%29-measures) as process guidance. [W3C direction guidance](https://www.w3.org/International/questions/qa-html-dir) informs RTL handling. These sources support careful adaptation and documentation; they do not validate Worldview Sorter's translated items. After actual multilingual response data exist, researchers must study differential item functioning, measurement invariance, option use, comprehension, and whether adapted analogues can be pooled. No such empirical claim is made here.
