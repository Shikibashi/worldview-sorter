# QA plan — reference readiness audit v1

## Required checks

- Validate audit schema, unique claim IDs, and all proposition/source references.
- Verify exact active model, item-bank, route, affinity, and source-ledger pins.
- Check exact-revision route opportunity counts using distinct evidence units.
- Verify route omissions never produce opposition or direct coverage.
- Verify partial, unmeasured, missing, unsuitable, and context-only states remain distinct.
- Verify core gaps cannot be repaired by changing a minor claim.
- Verify unrelated proposition additions do not change candidate readiness.
- Verify deterministic JSON and Markdown regeneration.
- Assert the generated data has no matcher, identity, winner, or percentage fields.
- Preserve historical release artifacts and ensure model/content/public versions remain unchanged.

## Release verification

Run focused audit tests, deterministic academic build checks, `npm test`, and production build/release verification. Public application files are out of scope; browser UI tests are therefore not required by this audit change. GitHub Pages remains the production target; a Docker application deployment is not applicable to this static-only documentation/tooling release.
