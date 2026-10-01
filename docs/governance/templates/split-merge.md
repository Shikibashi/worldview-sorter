# Construct split or merge proposal prompts

Copy `model-change.json`; use `changeClass: split` or `merge` and list all old and new IDs in `affectedObjects`.

- Preserve old definitions and versions. State the semantic relationship and version boundary explicitly.
- For a split, show which old evidence reaches each new proposition; do not distribute old answers by assumption.
- For a merge, explain why either prior answer set does not automatically establish the combined claim.
- Identify route, affinity, research export, historical replay, and current reinterpretation effects. Raw responses are never rewritten.
