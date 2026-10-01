# QA scenarios

| Case | Synthetic answers | Expected result |
|---|---|---|
| Consistent social-control preference | PLI060 favors binding workplace votes; PLI123 selects worker or accountable-public control | `supported` for the scoped two-setting proposition |
| Consistent alternative preference | PLI060 favors owner-appointed managers; PLI123 selects private-owner or unaccountable-state control | `opposed` |
| Cross-setting divergence | PLI060 and PLI123 point in opposite directions | `mixed_context_dependent`; no consistency penalty |
| One direct answer only | One directional response; other item unanswered | `leaned_toward`, never `supported` or `opposed` |
| No directional evidence | neutral, mixed/other, no-view, not-understood, or missing responses | `insufficient_evidence` |
| Route omission | Quick or Standard does not present either exact revision | `not_measured` |
| Common-ownership neighbor | Common ownership legitimacy without PLI060/PLI123 | No evidence for PL39 |
| Market-coordination neighbor | Market/planning preferences without PLI060/PLI123 | No evidence for PL39 |
| Statist false positive | PLI123 selects state officials without worker/public control | Opposes democratic/social control; does not establish socialism or anti-socialism identity |
| Historical compatibility | Replay release 1.18.0 | PLI060@1, its old bank and route, and all old release hashes remain unchanged |

These fixtures verify deterministic software behavior only. They are not participant data or evidence of validity, reliability, comprehension, or item independence.
