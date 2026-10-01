# A research-informed quiz, not a research form

The public production experience opens at `https://worldview.edriffles.us/`; the development server serves the same client at `/apps/quiz/`. The older `/apps/web/` client remains a development/collection interface, not the public experience.

## The experience

The current respondent-facing questionnaire is English (en-US) only. There is no language selector or alternate-language administration path.

The landing page now includes a clearly fictional result preview. The completed report opens with an evidence-qualified overview and a categorical twelve-topic map. A featured proposition requires a direct interpretation with an exact target and eligible source-claim review. When none clears that bar, the overview labels available authored answer patterns as under model review. Each topic strip counts assessed and unmeasured interpretation paths without a continuous ideology score. Sticky section navigation leads to the existing evidence, comparisons, reading, and voluntary sharing. The portrait SVG share card comes from the same versioned, privacy-safe snapshot as the text and JSON; it is a selection of that context, not a replacement for the complete snapshot.

The [public visual contract](../DESIGN.md) follows the edriffles Computer Web language while keeping the questionnaire a readable page. It uses one unchanged question at a time, three clearly labeled depth routes (64/120/247 questions), visible completion progress, optional 200 ms auto-advance, Back, pause/resume, and answer backups. On a question change, focus moves to the prompt without browser-driven scrolling and the quiz frame returns to a consistent viewport position. There is no timer, correctness grade, hidden default answer or leaderboard. Ranking questions require an explicit unique rank for every option and confirmation; they are not silently submitted in a randomized default order.

Finishing produces an evidence-backed twelve-topic summary. The pilot route presents a short overview, domain and subfacet groups, mixed or insufficient evidence, not-measured areas, and inspectable answer and source provenance. Each pattern shows its recorded proposition or a visibly qualified inherited rule scope, the exact questions and revisions, the respondent's answer labels, how each answer counted, and the cited source's stated relevance where recorded. A scope-only rule has no separately recorded standalone proposition. If a source has only topic-level metadata, the detail says its claim-level relevance is not recorded. A derived result names its required direct propositions and their observed states; the direct results retain their own question evidence. If a derived rule lacks an exact public prerequisite or rule-linked supporting source claims, its historical engine state remains available in technical provenance while the visible row says the interpretation awaits model review. Supported, leaned toward, mixed or context-dependent, opposed, insufficient evidence, and not measured remain distinct. In particular, zero on an importance scale is not relabeled as agreement neutrality. A topic with insufficient evidence is not scored as neutral. Mixed answers are not a defect or a consistency grade.

Quick and Standard are authored subsets of the frozen pilot, not validated short forms. They intentionally leave more propositions unmeasured; users can keep their result, clarify a domain, or continue without repeating compatible answers. See [the depth-route contract](PROGRESSIVE_DEPTH.md). No completion-time estimate is advertised without observed evidence. Released question wording and historical versions are preserved; the active interpretation model has its own version.

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

The public client now provides optional source trails, neutral activity milestones, and user-initiated doctrine comparisons. Possible later additions include cosmetic themes and selected-pattern comparison. These are extensions to exploration, not upgrades to someone's supposed rationality or morality. No game mechanic may change item selection, interpretation thresholds, ideological labels or the wording being measured without a separately versioned measurement change.

Even answer-independent incentives could affect how people respond. Identical raw answers producing identical results proves code isolation, not psychological measurement equivalence. Any later experiment should separately measure enjoyment/abandonment and response distributions, missingness, time patterns and subgroup effects. Retaking after reading explanations can also change responses; no repeated-play incentive is active. The raw session records an exact client version; the current interface is `quiz-1.8.0`, while older backups retain their versions.

## Privacy and sharing

The new public quiz does not POST answers or call analytics. It works with local browser storage and explicit exports. Ordinary hosting requests still expose network metadata to the host; the interface does not promise network anonymity.

Sharing is opt-in. The user chooses an overview, domain, affinity or exploration snapshot, inspects its exact text, then deliberately copies or downloads it. Versioned snapshot JSON has an accessible local file viewer and SVG has a text equivalent. No result is automatically published. The projection excludes raw answers, session IDs, research consent and account data. The recipient may still learn sensitive beliefs from the selected text. See [engagement and sharing boundaries](ENGAGEMENT_SHARING.md).

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
