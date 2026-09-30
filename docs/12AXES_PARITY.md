# 12Axes interaction-parity reference

> Historical milestone. This document describes the earlier 80/120/160 collector contract. The current public quiz uses 64/120/238 routes and does not automatically submit answers. The active contract is checked by `npm run test:consumer-experience` and the production browser suite.

The browser runner intentionally borrows the interaction pattern of modern 12Axes while not copying its political dimensions, scoring model, or source code.

Reference implementation reviewed:

- Question card: https://github.com/RomanCypherpunk/12axes/blob/main/frontend/src/components/QuestionCard.tsx
- Progress header: https://github.com/RomanCypherpunk/12axes/blob/main/frontend/src/components/ProgressHeader.tsx
- Quiz selection: https://github.com/RomanCypherpunk/12axes/blob/main/frontend/src/utils/quizSelection.ts
- Quiz selection tests: https://github.com/RomanCypherpunk/12axes/blob/main/frontend/src/utils/quizSelection.test.ts
- Quiz/server API: https://github.com/RomanCypherpunk/12axes/blob/main/frontend/src/services/quizApi.ts
- Main flow: https://github.com/RomanCypherpunk/12axes/blob/main/frontend/src/App.tsx

## Behavioral parity targets

The Worldview Sorter runner now provides:

1. one question at a time;
2. visible selected-answer feedback;
3. progress count and percentage;
4. three length presets;
5. default auto-advance;
6. a 200 ms auto-advance pause after selection;
7. Back navigation;
8. optional manual Next;
9. deterministic balanced packet construction;
10. server submission at completion;
11. completion state after all eligible items are answered.

## Intentional differences

12Axes primarily administers five-point agreement items over predefined bipolar political axes.

Worldview Sorter must additionally support:

- value-importance responses;
- moral-relevance responses;
- categorical philosophical choices;
- vignettes;
- paired tradeoffs;
- rankings;
- conditional branches;
- explicit no-view / not-understood / not-applicable states.

The project therefore targets **interaction parity**, not scoring or ontology parity.

No code from RomanCypherpunk/12axes is copied because that repository is source-visible but proprietary.

## Automated parity tests

`scripts/test-12axes-parity.mjs` asserts the behavior contract and then tests all three presets.

It generates:

- 40 Short packets;
- 40 Standard packets;
- 40 Long packets.

For all 120 generated packets it checks:

- exact requested item count;
- no duplicate questions;
- approximate domain-proportional selection;
- no run longer than two questions from the same domain;
- branch prerequisites are present;
- prerequisites appear before dependents;
- same seed produces the same packet.

It also simulates one complete response flow for each preset and verifies every packet position ends as either:

- answered; or
- legitimately branch-skipped.

These tests complement, rather than replace, future browser-level accessibility/usability testing.
