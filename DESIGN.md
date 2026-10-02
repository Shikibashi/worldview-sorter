# Worldview Sorter public interface

The public application is a React/Vite experience built on the user-owned [Shikibashi/12axes](https://github.com/Shikibashi/12axes) front-end foundation. Its screen flow is **home → depth choice → one question at a time → results**. The active interface is English-only. See [the adoption record](docs/12AXES_FOUNDATION_ADOPTION.md) for the source revision and boundaries.

## Foundation and visual system

- Use the 12Axes editorial tokens, typography, responsive page grid, raised editorial sections, route cards, and mobile navigation patterns from the fork.
- Keep Worldview Sorter's own brand treatment: forest/cream/ink palette, one neutral accent, and no ideology-specific colors.
- Preserve the 12Axes separation between landing, route selection, questionnaire, and results. The Worldview route chooser receives only the route labels, lengths, and descriptions from the active release.
- Keep the 12Axes single-question rhythm, compact progress segments, answer feedback, sticky result navigation, and roomy report hierarchy.
- Use Worldview Sorter evidence states for results. Domain summaries are categorical and include coverage; they are not bipolar axes or percentages.

## Semantic boundary

The front-end foundation does not define philosophical meaning. The active question bank, interpretation model, response meanings, affinity catalog, route versions, and historical replay remain Worldview Sorter data and logic. UI components must not calculate ideology coordinates, select nearest profiles, assign identities, or translate missing responses into neutral answers.

The user may inspect supporting answers and sources progressively. An at-a-glance view should remain understandable without exposing internal rule IDs. Mixed, insufficient, not-measured, no-view, and neutral states must remain distinguishable.

## Questionnaire interaction

- Keep focus and progress stable when a question changes; do not jump the page because the prompt length changed.
- Use labeled keyboard controls, native select elements for rankings, visible focus, and no required drag interaction.
- Preserve back, pause/resume, local answer recovery, deliberate exports, and the user's ability to stop at the selected route.
- No timer, response reward, ideology color, correctness grade, or result hint may encourage a preferred answer.
- Respect reduced-motion preferences and reflow the route cards, question controls, and result navigation on mobile.

## Validation

Validate the compiled static artifact, not only the development server. Production browser coverage checks the landing and depth chooser, all active routes, pause/resume, result generation, sources, exports, mobile layout, keyboard flow, reduced motion, and the no-upload boundary. Passing software checks does not establish human comprehension or instrument validity.
