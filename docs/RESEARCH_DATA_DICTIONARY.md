# Research package 1.1.0 data dictionary

The versioned independent-research snapshot reuses these normalized tables and adds a separate item codebook, derived layer, diagnostics, readiness screen, and manifest. See [snapshot extension fields](../research/SNAPSHOT_DICTIONARY.md). Snapshot-specific pseudonyms replace the private export pseudonyms without changing within-snapshot repeat linkage.

All four NDJSON files have one JSON object per line. Empty files contain zero lines. `null` is an explicit missing value, never a midpoint. IDs are stable within a package and are not account IDs. All fields in the four tables and `versions.json` are research-facing; source snapshots are reference content. Data classification: **pseudonymous sensitive** for respondent, administration, and response rows; **public authored metadata** for items, version IDs, and snapshots. The package itself remains private pending governance review. The schema is `research-export.schema.json`.

| File.field | Type and allowed values | Meaning and missingness | Version/privacy |
| --- | --- | --- | --- |
| `respondents.researchRespondentId` | string `r-…` | Research-only pseudonym; never null. Random per attempt by default, stable across opted-in attempts from a browser link secret. | Package 1.0.0; pseudonymous sensitive. |
| `respondents.linkageOptIn` | boolean | Whether this respondent chose longitudinal linkage; never null. `false` does not prove this is a unique person. | Package 1.0.0; sensitive metadata. |
| `administrations.researchAdministrationId` | string `a-…` | Unique research attempt key; never null. | Package 1.0.0; pseudonymous sensitive. |
| `administrations.researchRespondentId` | string `r-…` | Join to respondents; never null. | Package 1.0.0; pseudonymous sensitive. |
| `administrations.contributedDate` | ISO date `YYYY-MM-DD` | UTC date on which this attempt was contributed; no answer or session time is exported. Useful for coarse longitudinal ordering; same-day order is unknown. | Package 1.0.0; sensitive temporal metadata. |
| `administrations.completionStatus` | `completed` or `in_progress` | Whether the contributed attempt finished. An in-progress attempt may have unreached positions. | Package 1.0.0; sensitive. |
| `administrations.assignedItems` | integer ≥1 | Frozen route positions assigned, including branch skips. | Package 1.0.0; sensitive context. |
| `administrations.recordedResponses` | integer ≥1 | Number of submitted response records, including special states; not the count of substantive answers. | Package 1.0.0; sensitive context. |
| `administrations.consentVersion` | string, currently `research-consent-1.0.0` | Terms affirmed for this attempt. No null. | Consent version; governance metadata. |
| `administrations.bankVersion` | string | Item bank version. | Historical replay key; public metadata. |
| `administrations.instrumentVersion` | string | Instrument manifest version. | Historical replay key; public metadata. |
| `administrations.formPolicyVersion` | string | Fixed route/order policy version. | Historical replay key; public metadata. |
| `administrations.modelVersion` | string | Authored interpretation-rule snapshot version, not a validity claim. | Historical replay key; public metadata. |
| `administrations.resultSemanticsVersion` | string | Meaning of supported, leaned toward, mixed, opposed, insufficient, not measured. | Historical replay key; public metadata. |
| `administrations.derivedInferenceVersion` | string | Version of derived proposition rules. | Historical replay key; public metadata. |
| `administrations.affinityCatalogVersion` | string | Version of doctrinal comparison definitions. | Historical replay key; public metadata. |
| `administrations.respondentLocale` | `en`, `en-US`, or null | Locale recorded by the client. Current research export rejects unsupported values, including arbitrary client text; null for old records that lack it. This is not nationality or ethnicity. | Package 1.1.0 with extractor 1.2.1; sensitive context. |
| `administrations.presentationLocale` | `en-US` | Language realization used for the eligible English pilot; historical unpinned English attempts are treated as `en-US`. | Package 1.1.0 with extractor 1.2.1; replay key. |
| `administrations.interfaceLanguage` | `en` or null | Interface language recorded for a pinned localization; null where historical UI language cannot be established. | Package 1.1.0 with extractor 1.2.1; context. |
| `administrations.localizationCatalogVersion` | string or null | Catalog release selecting the wording bundle; null for pre-localization attempts. | Package 1.1.0; replay key. |
| `administrations.localizationBundleVersion` | string or null | Exact language bundle release; null for pre-localization attempts. | Package 1.1.0; replay key. |
| `administrations.modelReleaseVersion` | string or null | Immutable cross-component model manifest for newer administrations; null for older administrations whose component tuple remains separately recorded. | Package 1.1.0; replay key. |
| `administrations.releaseChannel` | `development`, `internal`, `preview`, `beta`, `stable`, or null | Channel declared by the pinned session; null for older administrations. It is operational context, not an empirical sampling frame. | Package 1.1.0; context metadata. |
| `responses.researchAdministrationId` | string `a-…` | Join to administration; never null. | Package 1.0.0; pseudonymous sensitive. |
| `responses.position` | integer ≥0 | Zero-based position in assigned frozen route; never null. | Instrument-specific; sensitive context. |
| `responses.itemId` | string | Stable question ID; never null. | Item revision key; sensitive context. |
| `responses.itemRevision` | integer ≥1 | Exact question revision presented or assigned; never null. | Item revision key; sensitive context. |
| `responses.domainId` | string | Authored domain/panel ID, not a latent factor. | Bank version; public metadata. |
| `responses.responseType` | `likert`, `paired_choice`, `single_choice`, `vignette_choice`, `ranking` | Raw response format. | Item revision; public metadata. |
| `responses.responseScaleId` | string | Key in `response-scales.json`. | Scale snapshot; public metadata. |
| `responses.presented` | boolean | Whether question was shown at any point. A shown but unanswered partial question may have `not_reached`; use with responseState. | Package 1.0.0; sensitive. |
| `responses.responseState` | `answered`, `no_view`, `not_understood`, `not_applicable`, or null | Original response state; null means no response record. `no_view` is no current position, `not_understood` means the distinction was not understood, `not_applicable` means the item/scenario did not apply. None is a neutral answer. | Scale snapshot; sensitive. |
| `responses.missingReason` | `no_view`, `not_understood`, `not_applicable`, `branch_not_shown`, `not_reached`, or null | Null only for substantive `answered`. Special states mirror responseState. `branch_not_shown` means routing excluded the item; `not_reached` means no response record by submission. Item unavailable in an older instrument is represented by absence from that instrument's assigned rows, not a null response. | Package 1.0.0; sensitive. |
| `responses.rawValue` | integer, string option ID, ordered array of string option IDs, or null | Exact selected value for `answered`; null for every other state. A `0` on agreement/paired scales is a substantive midpoint and must not become missing. Item-specific option IDs are in `items.ndjson`. | Scale/item revision; highly sensitive. |
| `responses.changedAnswerCount` | integer ≥0 | Count of recorded answer changes; zero if no answer. No change timestamps or response speeds are exported. | Package 1.0.0; sensitive. |
| `responses.textVersion` | string or null | Exact approved wording assigned to this route position; `presented` tells whether it was actually shown. Null on historical sessions that did not pin localization. | Package 1.1.0; replay key. |
| `responses.variantId` | string or null | Locale-specific variant identity, if a reviewed variant was presented. Null for canonical wording. | Package 1.1.0; comparability key. |
| `responses.translationStatus` | `approved` or `historical_canonical_unpinned` | Wording approval state at contribution. The latter marks older English sessions without a per-item wording pin, not a translated draft. | Package 1.1.0; comparability key. |
| `items.position` | integer ≥0 | Route position. | Frozen instrument; public authored metadata. |
| `items.itemId` | string | Stable question ID. | Item revision key; public authored metadata. |
| `items.itemRevision` | integer ≥1 | Exact wording revision. | Item revision key; public authored metadata. |
| `items.domainId` | string | Authored domain/panel. | Bank snapshot; public authored metadata. |
| `items.responseType` | same enum as responses | Question response format. | Item revision; public authored metadata. |
| `items.responseScaleId` | string | Scale key. | Scale snapshot; public authored metadata. |
| `items.text` | string | Exact frozen prompt wording. | Item revision; public authored metadata. |
| `items.options` | array of choice objects or null | Item-specific option IDs/labels, if present; null when the scale supplies options. | Item revision; public authored metadata. |
| `items.eligibility` | object or null | Routing condition from the bank; null if absent. This is a rule snapshot, not evidence that the item was shown to a particular person. | Item revision; public authored metadata. |

For the frozen route, each `items.options[]` object has `id` (stable string option code) and `label` (displayed string meaning); both are required for an item-specific choice and public authored metadata. `items.eligibility` has `mode` (`always` or `conditional`) and `all` (array of required conditions). A condition has `kind` (`response_option_in`), `itemId` (prerequisite question ID), and `optionIds` (array of option IDs that make the item eligible). Empty `all` means no prerequisite. These nested fields follow the frozen item revision; they are never respondent answers. See the included item-bank/instrument snapshots for their exact definitions.

## Coded answers

For `agreement5`, `-2/-1/0/1/2` mean strongly disagree/disagree/neutral/agree/strongly agree. For `paired5`, the same numbers mean strongly favor A/lean A/neither or equal/lean B/strongly favor B. Other numeric scales, their labels, special-state allowances, and order are defined exactly in `response-scales.json`; use that file instead of assuming all `-2…2` scales mean agreement. Choice IDs and ranking order come from `items.ndjson`. `rawValue` is not a transformed construct score. There is no exported `invalid` category because invalid payloads are rejected before storage.

## Version and manifest metadata

| `versions.json` field | Type and meaning | Missingness/classification |
| --- | --- | --- |
| `datasetSchemaVersion` | string `research-package-1.1.0`; format of these tables. | Required; public metadata. |
| `localizationCatalogVersions` | array of catalog versions included as frozen reference files. | Required; public metadata. |
| `localizationBundleVersions` | array of wording bundle versions included as frozen reference files. | Required; public metadata. |
| `modelReleaseVersions` | array of cross-component model release manifests included with the package. | Required; public metadata. |
| `consentVersion` | string `research-consent-1.0.0`; terms affirmed per contribution. | Required; governance metadata. |
| `consentSha256` | lowercase SHA-256 hex of `consent-terms.json`. | Required; integrity metadata. |
| `bankVersion` | string; bank snapshot. | Required; public metadata. |
| `instrumentVersion` | string; frozen instrument snapshot. | Required; public metadata. |
| `formPolicyVersion` | string; route snapshot. | Required; public metadata. |
| `modelVersion` | string; authored interpretation snapshot. | Required; public metadata. |
| `resultSemanticsVersion` | string; evidence-state semantics. | Required; public metadata. |
| `derivedInferenceVersion` | string; derived-rule snapshot. | Required; public metadata. |
| `affinityCatalogVersion` | string; affinity definition snapshot. | Required; public metadata. |
| `catalogSha256` | lowercase SHA-256 hex of the catalog definition. | Required; integrity metadata. |
| `pilotCandidateVersion` | string; candidate release manifest. | Required; public metadata. |
| `sampling` | string; voluntary opt-in sampling limitation. | Required; public metadata. |
| `interpretation` | string; authored-label limitation. | Required; public metadata. |

`manifest.json` has `datasetSchemaVersion` (format ID), `generatedAt` (UTC ISO timestamp for export event, not respondent activity), `contributionDateWindow` (`{from,through}` inclusive UTC dates or null for a whole-store export), `activeContributions`, `respondentRows`, `administrationRows`, `responseRows`, `itemRows` (nonnegative integer counts), and `files` (array of `{path, sha256, bytes}` describing every package file except the manifest itself). All are required package audit metadata, never missing, and contain no account identifiers. Reference JSON snapshots retain their own schemas and version IDs; their fields are defined in the included source files and repository schemas. They are authored content, not respondent measurements. Historical packages preserve exact snapshots and hashes; a later release must use a new dataset schema/version and must not edit an earlier package in place.
