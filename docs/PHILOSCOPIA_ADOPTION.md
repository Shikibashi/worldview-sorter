# Philoscopia-inspired semantic exploration

## Decision

Worldview Sorter should borrow the useful **relation-graph idea** from the public
[Philoscopia framework](https://github.com/fbgallet/philoscopia-open) without replacing
Worldview Sorter's evidence-first interpretation model.

The inspected upstream repository is the open framework/corpus behind Philoscopia, not
a published copy of the entire `www.philoscopia.com` application. Its repository states
that data and documentation are CC BY-SA 4.0 and code is MIT licensed. This integration
does **not** vendor the Philoscopia corpus, schemas, profiles, translations, or prose.
The implementation below is original Worldview Sorter code and authored data inspired by
the upstream architectural separation among positions, foundations, tensions, and arguments.

If a future change imports upstream corpus material directly, keep it in an explicitly
attributed third-party area and review the applicable share-alike and attribution
requirements before mixing it with first-party data.

## What we take

Philoscopia's strongest fit with this project is that relationships among philosophical
positions are modeled explicitly rather than reduced to distance in an ideology vector.

Worldview Sorter therefore adds a versioned semantic relation layer over its **already
interpreted propositions**:

- `grounding`: an explanatory reason one proposition can support another;
- `non_entailment`: an explicit guard against a common false inference;
- `compatibility`: positions that can coherently coexist despite being commonly treated
  as opposites;
- `potential_tension`: a source-backed pair worth examining without declaring the
  respondent inconsistent;
- `logical_conflict`: reserved for propositions whose recorded meanings cannot jointly
  hold, and therefore requires unusually strong editorial review.

The first catalog deliberately starts with relations already present in Worldview Sorter's
academic model and anti-inference work: fallibilism/contextual certainty, fallibilism versus
the pragmatic maxim, ownness versus ethical egoism, and exit versus reliance-based repair.

## What we do not take

Worldview Sorter does not adopt Philoscopia's scalar/weighted axis placement as a respondent
classifier. It also does not infer a user's philosophy from philosopher similarity,
movement profiles, extrapolated positions, or a nearest-profile calculation.

The public questionnaire remains English-only. Philoscopia's multilingual data model is not
a localization roadmap for this project.

Declared-versus-practiced placement is also not copied into respondent inference. A scenario
answer can expose a possible general/case tension, as the existing engine already does, but it
does not secretly rewrite the respondent's general proposition.

## Hard inference boundary

`data/exploration/semantic-relations-v1.json` has `inferenceAllowed: false`, and every
relation repeats that boundary. `packages/worldview/relations.js` consumes the output of the
existing worldview interpreter. It cannot:

- turn a premise into a newly supported proposition;
- change supported/opposed/mixed/insufficient/not-measured states;
- change an affinity comparison;
- assign a worldview identity or match percentage;
- treat a grounding relation as a substitute for a separately versioned derived rule.

A grounding edge is explanatory only. If a synthesis is strong enough to become a public
derived conclusion, it still has to enter the governed `derivedRules` mechanism with exact
prerequisites, source claims, conflict guards, versioning, and regression tests.

## Why this matters

This gives the result page a richer answer to "how do these commitments relate?" without
recreating the 12Axes failure mode. For example, a respondent can support fallibilism while
the graph explicitly records that this does not establish pragmatism. Likewise, an ownness
result cannot become ethical egoism by proximity or shared rhetoric.

## Next slices

After this relation layer is stable, the parts of Philoscopia worth adapting separately are:

1. an argument/objection catalog tied to exact Worldview Sorter propositions and sources;
2. optional thought-experiment exploration linked to a proposition but excluded from hidden
   scoring;
3. source-backed tradition/figure reading cards with explicit coverage and epistemic status,
   kept separate from respondent classification.

Those should be separate releases. The relation layer is intentionally small so its
inference boundary can be tested before adding more presentation features.
