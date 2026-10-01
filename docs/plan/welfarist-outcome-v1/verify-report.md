# Scoped verification: welfare-only outcome value

Status: PASS for the governed content and static quiz change. This is software and authored-semantic verification, not empirical validation.

| Requirement | Evidence | Status |
| --- | --- | --- |
| Exact proposition and neighbors | Governed review and proposals MCP-2026-087/-088; SEP Well-Being, Consequentialism, Environmental Ethics | PASS; scope distinguishes outcome value from right action and welfare content |
| Direct item evidence | `NEI124@2`, `NEI132@1`, model `reviewed-NE24-welfarist-outcome-value` | PASS; two directional units required; no affinity mapping |
| Response-state boundaries | `scripts/test-welfarist-outcome-release.mjs` | PASS; support, opposition, mixed, one-unit lean, nondirectional, missing, and route omission |
| Historical compatibility | Release 1.16.0 manifest and frozen predecessor bank/model/route | PASS; prior paths remain pinned |
| Route coverage | Progressive-depth report and `data/reviews/pilot-evidence-dispositions-v15.json` | PASS; route sizes 64/120/245; Full opportunities 95/145; 50 direct-rule gaps remain |
| Static Pages integrity | `node scripts/build-production-site.mjs`; `node scripts/verify-production-site.mjs` | PASS; 205 files, 23,963,369 bytes; internal collection paths excluded |
| Static Chromium | `scripts/test-production-site-browser.mjs` | PASS; 76 checks across Quick, Standard, Full; no automatic response POST |
| Quiz Chromium and accessibility | `scripts/test-quiz-browser.mjs` | PASS; 208 checks, including mobile/keyboard/axe and exact new item revisions |
| Repository regressions | `npm test` | PASS with the repository's normal pretest and prevalidate rebuilds; release sync now restores the 0.17 research pool, academic release, and pilot together with the 1.17 model |
| Production build | `npm run build:production`; `node scripts/verify-production-site.mjs` | PASS; 205 files, 23,964,646 bytes; active release is 1.17.0 |
| Production deployment | GitHub Actions, custom-domain DNS/HTTPS, live 1.17.0 metadata | NOT RUN; the release is not merged yet |

The browser and profile fixtures use synthetic answers. The linter flags `NEI132@1` as a 34-word vignette stem for readability review. This is retained as a comprehension risk for future human response-process study; no comprehension or item-independence claim is made.

No API, database, authentication, telemetry, or privacy boundary changed. Docker is not the production architecture: the required static artifact fallback was built and served through the existing Chromium harness. Docker-phase evidence is therefore weak by design and no Docker deployment files were added.
