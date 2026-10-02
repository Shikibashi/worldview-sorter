# 12Axes foundation adoption

Worldview Sorter's public React application is built on the front-end foundation in the copyright-holder's `Shikibashi/12axes` fork at commit `3668cf81608f2638e22367593e7dba403fc5132e`. This is a direct, user-authorized integration into the Worldview Sorter repository, not a third-party imitation or a claim that the two measurement models are equivalent.

## Foundation carried into Worldview Sorter

- React/Vite entry and component-based screen architecture, adapted from `frontend/src/main.tsx` and `frontend/src/App.tsx`.
- The editorial landing and example-result hierarchy from `frontend/src/components/editorial/HomeScreen.tsx`.
- The dedicated depth/variant chooser from `frontend/src/components/editorial/VariantScreen.tsx`.
- The one-question presentation and answer rhythm from `frontend/src/components/QuestionCard.tsx`, adapted to Worldview Sorter's response formats.
- The report hierarchy and persistent navigation from `frontend/src/components/editorial/ResultsScreen.tsx` and `frontend/src/components/results/ResultsNav.tsx`, rebuilt around evidence states rather than axis scores or matches.
- The fork's Poppins/Sora typography, editorial styles, and forest/cream visual tokens from `frontend/src/styles/`, adapted to remove ideology-specific result colors.
- A recoverable React error boundary based on `frontend/src/components/ErrorBoundary.tsx` that keeps locally saved answers untouched.

| 12Axes foundation source | Worldview Sorter adaptation |
| --- | --- |
| `frontend/src/main.tsx` | `apps/quiz-react/src/main.jsx` |
| `frontend/src/components/editorial/HomeScreen.tsx` | `apps/quiz-react/src/components/HomeScreen.jsx` |
| `frontend/src/components/editorial/VariantScreen.tsx` | `apps/quiz-react/src/components/RouteChooser.jsx` |
| `frontend/src/components/QuestionCard.tsx` | `apps/quiz-react/src/components/QuestionCard.jsx` and `ProgressHeader.jsx` |
| `frontend/src/components/editorial/ResultsScreen.tsx` and `frontend/src/components/results/ResultsNav.tsx` | `apps/quiz-react/src/components/ResultsView.jsx` and `ResultsNav.jsx` |
| `frontend/src/styles/tokens.css` and `editorial.css` | `apps/quiz-react/src/styles/12axes/tokens.css` and `editorial.css` |

The screen components in `apps/quiz-react/src/components/` are adapted to Worldview Sorter's data and response formats. Styling lives in `apps/quiz-react/src/styles/12axes/` and is adapted from the fork's `frontend/src/styles/`.

## Worldview Sorter remains authoritative for

- Question text, revisions, response options, and route contents.
- Evidence mappings, proposition states, derived interpretations, and affinity criteria.
- Missingness, uncertainty, historical replay, saved-answer format, and privacy behavior.
- Result summaries, share snapshots, source links, and model/release metadata.

The production app does not include the fork's political-axis scoring, ideology/personality/country matching, profile percentages, religion filter, backend API, answer submission, or third-party profile corpus. It does not reuse the fork's question bank or answer-key data. The Worldview Sorter browser still stores responses locally and exports only after a user action.

## Verification boundary

`npm run build:production` compiles the React/Vite entry, then assembles the approved static Pages artifact. The production browser suite exercises the compiled artifact and checks that the collector/server surfaces and answer-upload requests remain absent. No philosophical item, route, interpretation, affinity, or model version is changed by this UI foundation integration.

The Poppins and Sora font files are redistributed under the SIL Open Font License; their notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
