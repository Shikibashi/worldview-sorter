# Source correction proposal prompts

Copy `model-change.json`; use `objectType: source`, `changeClass: source_correction`.

- Identify the exact claim currently attributed to the source and whether the source supports, challenges, or contextualizes it.
- Classify the source by role: primary text, scholarly translation, article, book, reference work, measurement literature, or provisional material.
- Explain whether this changes a definition, rule, criterion, or only citation metadata. A stronger conflicting source merits substantive review.
- Keep the old source snapshot resolvable, add a new versioned source artifact, and review every dependent claim shown by `model-governance impact`.
