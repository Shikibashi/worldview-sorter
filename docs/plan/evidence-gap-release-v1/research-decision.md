# Evidence-gap successor release — research decision

Date: 2026-10-03
Baseline: model release 1.19.0 at `f73dc20b1a94e4609394db6b1be2ecd7bdcf94ed`.

## Decision summary

This release closes exactly three already-identified direct-evidence gaps without turning neighboring propositions into proxy evidence.

### NE26 — general happiness as ultimate moral standard

Retain the interpretation-neutral proposition and the two evidence units fixed by MCP-2026-094 and PR #38. Mill's *Utilitarianism* Chapter II presents utility/general happiness as the foundation or ultimate standard while also allowing secondary principles. Current scholarly treatments distinguish that first-principle role from the disputed question whether Mill is best reconstructed as direct act, rule, sanction, or another indirect utilitarian. NE22–NE25 therefore remain neighbors and never substitute for direct NE26 evidence.

Exact proposition: **General happiness is the ultimate moral standard: moral rules, duties, and judgments are ultimately justified or resolved by their relation to the general happiness, without requiring that standard to be applied directly to each individual act.**

Evidence units: `NEI134@1` and `NEI135@1`, both Full-only and widely separated.

### EP03 — fallible truth attainability

The previous audit correctly rejected a direct rule because the old pool mixed three distinct questions: whether some objectively correct answers are attainable, whether knowledge requires certainty, and whether some domains may remain unknowable. The SEP treatment of certainty distinguishes certainty from ordinary/fallible knowledge, and the IEP treatment of fallibilism explicitly allows knowledge while a possibility of error remains.

The existing `EPI010@1` already asks the narrow attainability question. The unreleased `EPI118@1` adds a different judgment task: whether a repeatedly tested factual claim may count as objectively correct knowledge while remaining revisable. Together they support a narrower proposition without treating uncertainty or domain-limited skepticism as opposition.

Exact proposition: **Human inquiry can sometimes reach objectively correct answers to factual questions even when those answers remain fallible and open to revision.**

Evidence: `EPI010@1` agreement/opposition plus `EPI118@1` (`fallible_knowledge` support; `support_only` and `practical_only` oppose; `case_dependent` nondirectional). Both are Full-only for the initial release.

Non-entailments: certainty, universal knowability, realism about every domain, scientific infallibility, or a denial that some questions may remain unknowable.

### AH01 — belief that some human action is genuinely free

The Free Will Inventory literature separates belief in free will from beliefs about determinism and dualism, and the SEP treats the existence/analysis of free will separately from the compatibility question. The previous AH01 pool was therefore unsafe because several items asked whether freedom is compatible with prior causes rather than whether any human action is actually free.

`AHI001@2` is a direct existence/control statement. Unreleased `AHI106@1` explicitly asks for the respondent's view about human free will while bracketing its correct explanation. Only `some_free_will` is positive direct evidence; `no_free_will` is opposition; `conditional_free_will` and `undecided` remain nondirectional because merely saying free will is possible under a condition does not establish that the condition is ever met.

Exact proposition: **Human beings sometimes act with genuine free will, without committing to a particular account of how free will is possible or whether determinism is compatible with it.**

Evidence: `AHI001@2` agreement/opposition plus `AHI106@1` as above. Both are Full-only for the initial release.

Non-entailments: determinism is true or false, compatibilism, incompatibilism, libertarian agency, moral responsibility, dualism, or a specific mechanism of control.

## Route and inference policy

Quick and Standard remain byte-for-byte unchanged. Full adds exactly six item references: the two new Mill units, EPI010@1 and EPI118@1, and AHI001@2 and AHI106@1. Each rule requires two distinct authored units. One directional unit only leans; directional conflict remains mixed; presented nondirectional evidence is insufficient; route omission is not measured.

No public affinity criterion is added for EP03 or AH01. The philosophical-affinity catalog advances only because it is model/instrument-bound.

## Reference profile policy

After the active successor contains NE26 and passes its regressions, the internal reference catalog may add one scoped John Stuart Mill comparison mapped only to NE26. It must not require NE22, NE23, NE24, or NE25 and must retain no-winner/no-percentage/no-identity semantics.

## Evidence-status caveat

The philosophical and measurement sources justify distinctions and source boundaries. They do not validate the authored item wording, two-unit threshold, route placement, respondent comprehension, or psychometric properties. Those remain provisional until empirical data exist.
