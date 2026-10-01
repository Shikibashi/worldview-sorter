# Reference-profile readiness audit

The reference-readiness audit is a reproducible coverage report for independently authored philosopher and philosophical-tradition claims. It asks whether the currently released Worldview Sorter propositions and public routes can assess each claim. It does not produce respondent profiles, change affinities, or validate the instrument.

## Run the audit

```sh
npm run reference:readiness
npm run test:reference-readiness
node scripts/build-reference-readiness-audit.mjs --check
```

The authored, version-pinned claims and source records are in [readiness-audit-v1.json](../data/reference/readiness-audit-v1.json). The deterministic machine-readable output is [readiness-report-v1.json](../data/reference/readiness-report-v1.json); the generated candidate-by-candidate report is [REFERENCE_READINESS_REPORT.md](REFERENCE_READINESS_REPORT.md).

The builder verifies the baseline against `data/current.json` and file hashes. If the active model, item bank, source ledger, routes, affinity catalog, or independent-authoring policy changes, it fails closed. Review the new model against every affected audit claim, then create a successor audit spec/output version. Do not update a released report in place or make the builder follow the newest model silently.

## Mapping states

| State | Meaning |
|---|---|
| `DIRECT` | The exact proposition has an active interpretation path with enough guaranteed, distinct authored evidence units on every public route. |
| `ROUTE_LIMITED` | An exact active path exists on at least one route, but one or more routes do not have enough evidence. |
| `PARTIAL` | An existing proposition measures only part of the candidate claim. It cannot fulfill the full claim. |
| `UNMEASURED` | The model recognizes the distinction, but no active public route can assess it. |
| `MISSING_PROPOSITION` | The proposition model lacks an adequate representation of the distinction. Related propositions are shown as adjacent coverage only. |
| `UNSUITABLE` | The claim should not serve as a respondent comparison criterion. |
| `CONTEXT_ONLY` | Historically or philosophically useful context that cannot affect respondent comparison. |

Direct versus derived describes the rule path and is separate from mapping state. The report counts route evidence opportunities from exact item revisions and distinct authored evidence units. Conditional item opportunities are shown as possible versus guaranteed and retain their branch prerequisites. These are not empirical information values.

## Source and inference boundary

Each candidate claim cites an exact source claim and locator. The audit checks source class, reference existence, and structural provenance; source citation does not establish that an item is valid. Model-rule source qualification is separately reported as claim-linked, source-IDs-only, or unresolved. Neither category is empirical validation.

The source policy in [authoring-policy-v1.json](../data/reference/authoring-policy-v1.json) remains authoritative. Third-party profile datasets are not content sources. Raw answers never map to a philosopher or tradition, route omission is not opposition, and no single winner is selected. Several comparisons may overlap; no comparison may fit.

## Candidate scope and limitations

The twelve initial candidates include already scoped WVS affinity entries, philosopher cases, traditions with defining gaps, and analytic philosophy as an intentionally context-only category. A `READY_FOR_PROFILE_AUTHORING` state means only that every *scoped core claim in this audit* has an exact current mapping with at least one capable route. It is not a quality rating of the philosopher, a claim that their complete philosophy is represented, or a claim that respondents will understand or endorse the intended distinctions.

The report is suitable for deciding which narrowly scoped profiles merit a separate, source-reviewed authoring change and which content gaps should remain explicit. It must not be used to expand routes or add items automatically.

## Existing-item gap review

The audit inspects candidate as well as route-administered items, but an item is not evidence for a public comparison until the applicable active interpretation path and route include it. The current review found:

- `EPI104@1` is a plausible additional pragmatic-maxim indicator but is not in a public route or the active `construct-EP16` evidence path. `EPI105@1` is an overbroad reverse-key candidate and cannot serve as the opposition pole without semantic review.
- `NEI121@1` is already used by `construct-NE15` on Full and can assess whether another person's need supplies an independent moral reason. It does not measure maximizing the agent's own good as the criterion of moral rightness. `NEI103@1`–`NEI105@1` concern practical reasons, not moral rightness.
- `MFI017@1` and `MFI027@1` provide the active `moral-concern-authority` path on all three routes; `SOI003@1` and `SOI027@1` cover relational aspects of identity. Together these are adjacent evidence for early Confucian role ethics, not evidence for ritual cultivation or its reciprocal, tradition-specific duties. `MFI005@2` is broad and unadministered; `VAI027@1` measures inherited-custom priority on Full.
- The candidate bank contains no reviewed item that directly isolates Hume's problem of induction or the Stoic thesis that virtue alone is good. Related causal, character, and flourishing items do not supply those distinctions.

These findings identify reuse opportunities and limits, not item-promotion recommendations. Any promotion or route change requires its own semantic review, governed release, and compatibility checks.
