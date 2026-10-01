# QA scenarios

| TC-ID | Scenario | Input | Expected result |
| --- | --- | --- | --- |
| WV-1 | Support | Welfare-only outcome value plus no value change without welfare change | Supported scoped proposition |
| WV-2 | Opposition | Independent outcome good plus beauty valuable without welfare effects | Opposed scoped proposition |
| WV-3 | Conflict | General welfare-only answer conflicts with beauty counterexample | Mixed/context-dependent |
| WV-4 | Single unit | Only one directional answer, including the beauty case alone | Lean only; no full welfarism inference |
| WV-5 | Nondirectional/missing | Context-dependent, unclear, no-view, or unanswered | Insufficient evidence |
| WV-6 | Short route | Quick or Standard administration omits both items | Not measured |
| WV-7 | Neighbor control | Welfare-only value with deontological rights constraints | No act-consequentialist or utilitarian inference |
| WV-8 | Historical replay | Release 1.16.0 answers and route | Old bank/model semantics remain available |
| WV-9 | Static browser | Quick, Standard, Full route and completion | New pair appears only at exact Full revisions; mixed evidence remains visible; no response upload |

## Execution record

- `scripts/test-welfarist-outcome-release.mjs`: PASS.
- `scripts/test-production-site-browser.mjs`: PASS, 76 checks on the assembled static artifact.
- `scripts/test-quiz-browser.mjs`: PASS, 208 Chromium checks.
- `npm --ignore-scripts run test`: PASS. `--ignore-scripts` avoids the pretest academic regeneration hook; the full test command itself ran against the explicitly versioned 1.17.0 candidate.

All respondent profiles were synthetic software fixtures.
