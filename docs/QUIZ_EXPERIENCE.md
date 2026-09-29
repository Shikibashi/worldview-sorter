# A research-informed quiz, not a research form

The public experience is at `/apps/quiz/`; the server's root redirects there. The older `/apps/web/` client remains a development/collection interface, not the default experience.

## The experience

The field-guide presentation uses one unchanged question at a time, three clearly labeled routes (80/120/160 questions), visible completion progress, optional 200 ms auto-advance, Back, pause/resume, and answer backups. There is no timer, correctness grade, hidden default answer or leaderboard. Ranking questions require an explicit unique rank for every option and confirmation; they are not silently submitted in a randomized default order.

Finishing produces an actual twelve-topic summary. Each pattern shows its scope, the exact questions and revisions, the respondent's answer labels, the rule's interpretation and its academic sources. Supported, opposed, mixed and insufficient evidence remain distinct. In particular, zero on an importance scale is not relabeled as agreement neutrality. A topic with insufficient evidence is not scored as neutral. Mixed answers are not a defect or a consistency grade.

The shorter route is a smaller sample, not a validated short form. No completion-time estimate is advertised without observed evidence. The question bank, interpretation model and historical versions are unchanged by this interface release.

## What academically backed means here

The existing conceptual source ledger and explicit response mappings remain the measurement foundation. Sources substantiate conceptual distinctions, not the validity of these original questions. This product is an exploratory, research-informed quiz, not a diagnostic or validated psychological instrument.

Pölzler (2018), [*How to Measure Moral Realism*](https://doi.org/10.1007/s13164-018-0401-8), identifies measurement problems caused by conflating related debates, incomplete response choices and first-order moral prompts. That motivates preserving the existing question wording and providing no ideology hints or approval of particular answers during administration. It does not validate the present implementation.

Sailer et al. (2017), [*How gamification motivates*](https://doi.org/10.1016/j.chb.2016.12.033), experimentally compared game-element configurations. Effects differed by psychological need; perceived decision freedom did not change as intended. We use this as a reason to specify and evaluate each game mechanic, not as proof that badges universally improve questionnaires. Abstract and discussion were reviewed in the [author-uploaded article](https://www.researchgate.net/publication/311879391_How_gamification_motivates_An_experimental_study_of_the_effects_of_specific_game_design_elements_on_psychological_need_satisfaction).

The implementation decisions below are engineering/design inferences, not findings from a study of Worldview Sorter. There has been no new participant study or cognitive-review gate. Published participant data, calibration parameters, norms and instrument validation are not transferred to this quiz.

## Three separate layers

1. `packages/worldview/`: question-response evidence and comparison rules. No reward inputs.
2. `packages/experience/quiz.js` and `summary.js`: administration and a readable projection of evidence. No new scoring weights or inferred identities.
3. `packages/experience/exploration.js`: an optional post-completion event reducer for future game mechanics. Disabled in the public client by default.

The third layer accepts only `quiz_finished`, `topic_opened` with a domain ID, and `source_opened`. It rejects answer values, timing, scores, personal identifiers and arbitrary extra properties. Proposed awards recognize opening a summary, exploring three topics, or reading a source. They are idempotent and never reward agreement, certainty, ideological consistency, speed, streaks or changing answers. The reducer cannot mutate questionnaire data or call the matcher.

Possible later additions include collectible topic cards, an optional reading trail, cosmetic themes and user-initiated comparison of selected patterns. These are extensions to exploration, not upgrades to someone's supposed rationality or morality. No game mechanic may change item selection, interpretation thresholds, ideological labels or the wording being measured without a separately versioned measurement change.

Even answer-independent incentives could affect how people respond. Identical raw answers producing identical results proves code isolation, not psychological measurement equivalence. Any later experiment should separately measure enjoyment/abandonment and response distributions, missingness, time patterns and subgroup effects. Retaking after reading explanations can also change responses; no repeated-play incentive is active. The raw session records `clientVersion=quiz-1.0.0` so this administration can be distinguished from the earlier client.

## Privacy and sharing

The new public quiz does not POST answers or call analytics. It works with local browser storage and explicit exports. Ordinary hosting requests still expose network metadata to the host; the interface does not promise network anonymity.

Sharing is opt-in. The user selects up to six resolved/mixed patterns, sees the exact text, and separately presses Copy. The preview omits raw questions/answers, timings, session IDs, seeds and game state. Its research-informed/exploratory qualification and bank/model versions remain attached. A shared pattern can still reveal a personal belief, so nothing is selected automatically. Summary export and raw-answer export are separate, deliberate actions.

The collector is retained for development use. Static serving is restricted to approved public assets and JSON; `.git`, `.data`, arbitrary repository files, private storage directories and symlink escapes are not served. This is not a claim that the collector is production-hardened; HTTPS termination, deployment logging, rate limits, consent and retention controls still require deployment decisions.

## Accessibility

Buttons have large targets, visible focus and text states rather than color-only meanings. Ranking uses native select controls rather than drag and drop. Question changes move focus to the prompt; the live status area does not repeatedly read the entire questionnaire. Reduced motion and forced colors are accommodated, and no audio is required. These decisions follow [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [animation guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). A full WCAG conformance audit is not claimed.

## Run and verify

```sh
npm run build:academic
npm run server:start
# Visit http://127.0.0.1:4173/ (redirects to /apps/quiz/)
npm run test:experience
```

`npm test` includes experience unit/regression tests. The separate Quiz experience workflow installs a pinned Playwright version, runs actual Chromium tests and stores synthetic screenshots. Tests exercise completion, pause/resume, all answer formats, no-view versus neutrality, source-linked results, sharing preview, no answer submission, mobile layout, reduced motion and private-file blocking. Passing these checks is software evidence, not proof that people find it enjoyable or that it measures a latent trait accurately.
