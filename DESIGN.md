# Worldview Sorter public interface

The public quiz follows the [edriffles Computer Web](https://edriffles.us/) visual language. This is a page-based questionnaire, not a simulated desktop. The reference was inspected at desktop and mobile sizes on 2026-09-30.

## Visual contract

- Use the light lavender 32 px grid outside one compact page surface. In dark mode, keep the same geometry with navy surfaces.
- Frame the page and meaningful content in square panels with visible borders and small hard shadows. Controls have a raised face and pressed state. Avoid rounded cards and soft floating shadows.
- Use Georgia for identity and display headings, Verdana for questions and answers, and Courier New for navigation, progress, and metadata.
- Keep the palette aligned with the reference: light background `#d6d9e8`, panel `#f4f3eb`, ink `#11132d`, border `#383f78`, and purple accent `#5530a3`. Dark tokens live in `apps/quiz/style.css` and retain the same roles.
- The masthead identifies Worldview Sorter as an edriffles project. The narrow strip communicates the current application and edition; it is not a fake operating-system window.

## Questionnaire behavior

- Each question starts with the quiz frame 16 px below the viewport top. Keyboard focus moves to the new prompt without browser-driven scrolling. This keeps topic, progress, and question position predictable when question lengths differ.
- The topic/progress area reserves enough room for ordinary topic labels. Longer text and enlarged text may grow naturally; no wording is clipped to preserve a fixed height.
- Answer buttons remain large, labeled controls. Selection uses both a border/radio mark and color. Ranking keeps native selects. No answer suggests an ideological reward.
- The route chooser appears early on narrow screens. Detailed topic coverage follows the route options rather than delaying them.

## Boundaries

The visual layer does not change item wording, route composition, saved answers, interpretation rules, or affinity evidence. The same CSS styles the local snapshot viewer. Reduced motion, keyboard focus, 200% text, and narrow layouts remain part of visual review.
