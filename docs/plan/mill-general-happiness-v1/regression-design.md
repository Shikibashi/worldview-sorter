# Mill general-happiness standard — governed regression design v1

Baseline: `03169ee9bf346473ae4e1e6ff33f307f61d770d2`.

This document specifies the regression contract for a future release of `reviewed-NE26-general-happiness-ultimate-standard`. It is intentionally written before activation so the evidence and inference boundary are fixed before implementation.

## Required future fixtures

| Case | NEI134@1 | NEI135@1 | Expected NE26 state |
| --- | --- | --- | --- |
| positive | `general_happiness` | `happiness_controls` | `supported` |
| negative-independent | `independent_authority` | `independent_rule_authority` | `opposed` |
| negative-pluralist | `plural_ultimate` | `plural_balance` | `opposed` |
| mixed-a | `general_happiness` | `independent_rule_authority` | `mixed_context_dependent` |
| mixed-b | `independent_authority` | `happiness_controls` | `mixed_context_dependent` |
| single-a | `general_happiness` | absent | `leaned_toward` |
| single-b | absent | `happiness_controls` | `leaned_toward` |
| nondirectional | `other` | `other` | `insufficient_evidence` |
| no-view | no-view | no-view | `insufficient_evidence` |
| missing | absent | absent on Full | `insufficient_evidence` |
| route omission | not administered | not administered | `not_measured` on Quick and Standard |

## Neighbor non-substitution

For each of the following, construct a synthetic Full response that strongly supports the neighboring proposition while omitting NEI134 and NEI135. NE26 must remain `insufficient_evidence`:

- `reviewed-NE22-act-consequence-criterion`
- `reviewed-NE23-rule-consequence-criterion`
- `reviewed-NE24-welfarist-outcome-value`
- `reviewed-NE25-total-welfare-maximization`

Also test combinations such as NE22 + NE24 and NE23 + NE24. No combination of neighboring rules is a derived substitute for direct NE26 evidence.

## Act/rule neutrality

NE26 is intended to sit above the disputed immediate criterion of rightness.

Future tests must show both of these are possible:

1. NE26 `supported` while NE22 is `supported` and NE23 is not required.
2. NE26 `supported` while NE23 is `supported` and NE22 is not required.

The NE26 implementation must contain no dependency on either rule and must not derive either rule from NE26.

A response pattern opposing both NE22 and NE23 may still support NE26 if the respondent endorses a different indirect utilitarian structure. The engine should not manufacture an act/rule conclusion.

## False-positive neighbors

The regression should explicitly cover:

- consequentialist concern without happiness as the ultimate value;
- happiness as one fundamental value among several;
- welfarist outcome value plus rights-based action constraints;
- total-well-being maximization without treating "happiness" as the relevant ultimate standard;
- useful secondary rules without a claim that their ultimate authority comes from general happiness;
- agreement with Mill's practical use of secondary rules while rejecting his utilitarian first principle.

## Route contract

- Quick item refs remain byte-for-byte identical to model release 1.19.0.
- Standard item refs remain byte-for-byte identical to model release 1.19.0.
- Full adds exactly NEI134@1 and NEI135@1 for this proposition.
- Both units must be guaranteed on Full, not branch-contingent.
- The items should be well separated from each other and not placed immediately adjacent to NEI122, NEI123, NEI124, NEI125, NEI132, or NEI133.
- A regression should enforce a meaningful spacing threshold selected during implementation.

## Source contract

The future rule must have claim-linked sources, not only source ids.

Required links:

- primary Mill *Utilitarianism*, Chapter II: `supports`
- SEP "Mill's Moral and Political Philosophy": `supports` for interpretation-neutral scope
- SEP "The History of Utilitarianism": `context`

Tests must confirm that:

- all ids resolve in the active source ledger;
- sources are exposed as rule-linked support/context only;
- no source claims to validate the authored item wording;
- no item-validity or psychometric claim is inferred from philosophical sources.

## Reference-profile gate

The current reference catalog must continue to contain no Mill profile before the successor release.

Once NE26 is active and all release regressions pass, a new internal-only scoped Mill comparison may be authored with exactly one required doctrinal claim mapped to NE26.

The catalog regression must reject any Mill profile that:

- requires NE22, NE23, NE24, or NE25;
- assigns a Mill identity;
- emits a winner, nearest profile, aggregate score, similarity, or percentage;
- treats omitted route evidence as opposition;
- hides the act/rule interpretive limitation.

## Historical contract

- Model release 1.19.0 and every earlier release remain immutable.
- Candidate bank 0.19.0, generic model 1.16.0, progressive-depth 2.7.0, and reference catalog 1.1.0 remain replayable.
- No historical answer is reinterpreted as NE26 evidence because NEI134/NEI135 did not exist in those releases.
- The PR #37 "Mill remains unprofiled" regression remains valid for historical release 1.19.0 even after a future successor can qualify the scoped comparison.

## Governance gate

A future activation proposal may move from `under_review` to `approved` only after philosophical and engineering review confirms:

- the wording does not silently encode act utilitarianism;
- the wording does not silently encode full rule consequentialism;
- the two units are not paraphrase duplicates;
- the negative options distinguish independent authority and plural ultimate standards;
- the source claims are narrower than a complete Mill identity;
- all required regressions are implemented and pass.

Synthetic fixtures establish deterministic inference behavior only. They are not psychometric validation.
