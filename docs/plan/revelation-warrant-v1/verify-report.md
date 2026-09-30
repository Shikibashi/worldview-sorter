# Scoped Argos verification: EP10 successor

Status: PASS for this governed content change, subject to hosted CI and live deployment checks. This verifies software and authored semantics, not psychometric validity.

| Requirement | Code or data path | Evidence |
| --- | --- | --- |
| Exact first-person proposition | `data/generic/model-v1.10-pilot.json`, `data/governance/proposals/MCP-2026-082.json` | The claim is defeasible initial factual reason for the experiencer; outsider and substantial warrant are excluded. |
| Exact item and answer path | `data/items/candidate-v0.14.json`, `scripts/test-revelation-warrant-release.mjs` | `EPI032@1` and `EPI122@1` are the two units; positive, opposed, provisional, context-dependent, missing, mixed, and false-positive neighbors are exercised. |
| Route and historical behavior | `data/experience/progressive-depth-v2.1.json`, release 1.13.0 manifest, historical 1.12.0 manifest | All three routes swap one exact item revision at the same position. Old releases remain pinned; unpresented `EPI021` cannot influence a successor result. |
| Source-to-claim and comparison boundary | `data/generic/source-ledger-v0.14.json`, `data/affinities/catalog-v2.1.json` | One SEP claim supports the possibility; another is contextual. Eleven comparisons have no new doctrine criterion. |
| User flow and static privacy | `dist/pages`, `scripts/test-production-site-browser.mjs` | Chromium exercised 69 checks across Quick, Standard and Full; no automatic answer POST or collector surface. |
| Regression and integrity | `npm test`, `npm run test:quiz:browser`, `npm run build:production` | Full suite passed; 203 quiz browser checks passed; static artifact contains 162 files. |

Flow check: exact revision → raw response → versioned evidence mapping → EP10 state → domain result follows the plan. Route omission stays `not_measured`; presented nondirectional or missing answers stay insufficient. Historical replay selects the historical manifest. No new API, authentication path, or production database exists for this change, so API direct-call and database-migration checks are not applicable.

Security/privacy check: no server or public upload path was added; the production browser test records no response POST. Production artifact exclusion is checked by the existing builder. Source URLs are public references. No secrets or raw answers were added to logs or documentation.

Caveat: the item linter flags `EPI122@1`'s 33-word stem for readability review. The distinctions between first-person, factual content, and independent checking are necessary for the current inference; human comprehension remains unmeasured. The two authored evidence units also share subject matter, so synthetic tests do not prove psychometric independence.
