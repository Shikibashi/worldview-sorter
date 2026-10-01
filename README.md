# Worldview Sorter

Twelve interface domains, not twelve forced bipolar latent traits.

## Current release

Candidate bank **0.19.0** contains **575 authored candidate items**. The active registry includes **188 permanent entries**. The public model has **147 direct interpretation rules**, of which **97** have a two-direction authored evidence path on Full. One bundled legacy ontology construct is deprecated, not silently redefined.

The historical 0.9.0 academic expansion added 30 distinctions and 90 items. The current source ledger adds claim-level links for subsequent reviewed releases. Sources support conceptual distinctions; they do not validate the questionnaire.

See [academic rationale](docs/ACADEMIC_GROUNDING.md), [item/source matrix](research/academic/CONSTRUCT_SOURCE_MATRIX.md), and [matching contract](docs/PROFILE_MATCHING.md).

## Run

```bash
npm run build:academic
npm test
npm run server:start
```

Run `npm run dev:quiz-ui` to develop the React application rooted at `apps/quiz-react/`. The separate collector utility is available through `npm run server:start`; see [server operations](docs/COLLECTION_SERVICE.md).

For the static GitHub Pages release, run `npm run build:production`, `node scripts/verify-production-site.mjs`, and `npm run test:production:browser`. The artifact is `dist/pages/`; [deployment operations](docs/DEPLOYMENT.md) describe the `main`-only Actions workflow, custom domain, privacy boundary, and rollback. The repository root is never the Pages artifact.

## Evidence, not identity guessing

The active public result uses 11 versioned philosophical comparisons over interpreted propositions. No political centroid, categorical numeric proxy, chat memory, preferred identity, or personality/country resemblance supplies missing answers. Neutral, no view, disagreement and mixed evidence remain distinct. There is no forced winner, match percentage, or automatically assigned identity.

The comparison rules are exploratory and unvalidated. The public browser presents proposition-level answer interpretations with their evidence and limitations; it does not present engineering scores as validated worldview measurements. The follow-up planner offers optional authored clarifications from identified evidence gaps; it is not calibrated adaptive testing.

## History

The 0.8 bank and instrument remain byte-for-byte frozen. New wording or targeting receives a new item revision. The 0.1 registry is archived; new observations use registry 0.2. Sources, release manifests, reference criteria and resulting comparisons are versioned independently.

## Commands

- `npm run test:profiles`: academic contrast and evidence-integrity regressions.
- `npm run test:collection`: collector integration tests.
- `npm run test:consumer-experience`: active public-route, privacy and result-presentation contract checks. The earlier 12Axes runner is a historical collector test.
- `npm run test:ui-smoke`: executes the app against a small DOM harness; not a real-browser accessibility/layout audit.
- `npm run pilot:packet -- --seed example --size 120`: administration packet.

No participant responses or empirical item parameters were fabricated. Published MFQ-2, PVQ-RR, Free Will Inventory and Oxford Utilitarianism Scale validation does not transfer to this project's original items.

## Additional measurement limits

See [methodological disagreements and explicit-endorsement limits](docs/METAETHICAL_MEASUREMENT_LIMITS.md), including a 2026 critique of folk-metaethical classification. A new versioned packet-ordering algorithm fixes a regression exposed by the expanded bank while preserving historical v0.8 packet replay.

## Generic academic comparison layer

The active generic model covers all twelve domains using reusable, source-traceable commitments. Personal priorities, normative principles, descriptive beliefs, ontological claims and institutional prescriptions are not conflated. No profile is forced and no match percentage is produced.

`npm run worldview:compare -- responses.json`

`npm run worldview:followups -- responses.json 12`

See [the generic source/item matrix](docs/GENERIC_WORLDVIEW.md), [source access ledger](research/academic/GENERIC_SOURCE_LEDGER.md), and [coverage report](data/generic/coverage-v0.1.json). Existing sample collection and older comparison modules remain compatibility/development tools; the generic layer does not require cognitive review or claim empirical validation.

## Public quiz experience

The root opens the React/Vite application built on the user-owned [12Axes front-end foundation](docs/12AXES_FOUNDATION_ADOPTION.md), with the active 64/120/249-question routes, pause/resume, a clearly labeled example result, and source-linked summaries. Results open with an evidence-qualified overview, a categorical twelve-topic map, and section navigation. It is exploratory, not a validated assessment. Answers stay in the browser unless the user exports or deliberately shares them. The static Pages site has no research-upload endpoint. The old `/apps/web/` development collector is absent from the production artifact.

Run `npm run dev:quiz-ui` to develop the React application locally. `npm run server:start` remains a separate development/collection utility.

`npm run test:experience` checks the controller, evidence summary, privacy-safe share projection and post-completion game boundary. The separate Quiz experience workflow tests Chromium with synthetic answers.

[Quiz experience and academic design rationale](docs/QUIZ_EXPERIENCE.md) explains future gamification. Game rewards are disabled by default and cannot use beliefs, scores, speed or ideological consistency. The current experience already provides a summary; no calibration flag has been used to claim validated worldview scores.

## Philosophy-domain content coverage

The public quiz uses a versioned content blueprint with separate ontology, metaphysics, metaethical, ethical, epistemic, and political/legal/economic facets. The active routes state their exact authored evidence opportunities; shorter routes leave many facets and propositions unmeasured. Original item text is unchanged; academic citations explain conceptual scope, not scientific validation of custom items. See [the domain/source/evidence specification](docs/PHILOSOPHY_DOMAINS.md).

## Full and historical routes

The active Full route uses the versioned 249-question successor pilot. The earlier frozen 238-question pilot and older 240-item and 80/120/160-item releases remain available for historical replay. No timer, new scoring assumptions, or automatic submission. Inapplicable branch follow-ups can be skipped. See [full-route behavior and compatibility](docs/FULL_ROUTE.md).

## Evidence-limited 49-construct audit

All 49 constructs unmapped in `coverage-v0.2.json` now have explicit dispositions. The active model retains only narrow direct propositions with answer-level counterexamples; other distinctions remain derived, research-only, split, or unresolved. The full route assigns the reviewed evidence bundles but individual results still depend on presented and answered items. See [the 49-construct audit](docs/UNMAPPED_AUDIT.md) and [current full-route behavior](docs/FULL_ROUTE.md).

## V1 pilot candidate

The active full-depth route is the 249-item `pilot-candidate-1.16.0` in `model-release-1.19.0`. It keeps the earlier 242- and 240-question full forms and all historical models at their versioned paths. Results separate route content gaps from respondent-level insufficient evidence and expose direct/derived provenance without percentages or assigned identities. See the [current Full-route contract](docs/FULL_ROUTE.md) and [historical pilot contract](docs/PILOT_V1.md).

## Data and optional research contribution

The public quiz has no account, analytics tracker, or automatic answer submission. The static Pages release has no research contribution, product-event, or feedback API. A separate development/research server retains the explicit-consent contribution system but is not deployed to the public domain. See [data boundaries and research handoff](docs/RESEARCH_DATA.md), [the data dictionary](docs/RESEARCH_DATA_DICTIONARY.md), and [public operations](docs/OPERATIONS.md).

[Progressive depth route purposes and limits](docs/PROGRESSIVE_DEPTH.md).

[Optional exploration, sharing, and historical snapshot limits](docs/ENGAGEMENT_SHARING.md).
