# Interpretation rule proposal prompts

Copy `model-change.json`; use `objectType: proposition` or `derived_rule`.

- Write the precise inferred proposition and its direct or derived status.
- Copy that exact reviewed proposition into the changed rule's `proposition` field in the new versioned model. A legacy `scope` label is not a substitute.
- List exact item IDs/revisions and supporting, opposing, mixed, contradictory, and missing behavior.
- Explain neighboring positions, non-entailments, likely false positives, thresholds, and whether evidence units are independent.
- Link each philosophical claim to its supporting source and add positive, negative, mixed, missing, neighbor, and historical fixtures. At least one proposal `sourceClaims` entry must be `supports`; `context` alone cannot authorize an inference.
- Carry the exact reviewed supporting `{sourceId, claim, relationship}` entry into the changed rule's `sourceClaims` in its new versioned model artifact. The source ID must also occur in that rule's `sourceIds`. This records a conceptual basis for the inference, not empirical validation of the question or threshold.
