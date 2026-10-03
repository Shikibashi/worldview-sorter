# Mill general-happiness standard — research and evidence design v1

Baseline: `main` at `03169ee9bf346473ae4e1e6ff33f307f61d770d2` after PR #37.

## Decision

The current model has a real semantic gap. None of `reviewed-NE22-act-consequence-criterion`, `reviewed-NE23-rule-consequence-criterion`, `reviewed-NE24-welfarist-outcome-value`, or `reviewed-NE25-total-welfare-maximization` exactly states the interpretation-neutral first-principle claim needed for the scoped John Stuart Mill reference candidate.

The smallest justified future proposition is:

> **General happiness is the ultimate moral standard: moral rules, duties, and judgments are ultimately justified or resolved by their relation to the general happiness, without requiring that standard to be applied directly to each individual act.**

Proposed id: `reviewed-NE26-general-happiness-ultimate-standard`.

This is deliberately narrower than a complete utilitarian theory and deliberately broader than any act-utilitarian, rule-utilitarian, sanction-utilitarian, total-welfare, or welfare-only formulation.

No active model object or Mill reference profile is added by this design. The current gap remains authoritative until a successor release actually contains two qualifying evidence units, route opportunity, claim-linked sources, and the governed regression set below.

## Source findings

### Mill's primary text

In *Utilitarianism*, Chapter II, Mill calls Utility or the Greatest Happiness Principle the foundation of morals and says that happiness is the standard of morality. Later in the same chapter he says that moral systems require subordinate or secondary principles, that conflicting rights and duties can be referred to an ultimate standard, and that utility can resolve conflicts between those secondary principles.

Primary text:

- John Stuart Mill, *Utilitarianism*, Chapter II, especially the opening statement of the Greatest Happiness Principle and the discussion of the "ultimate standard" and secondary principles: https://www.gutenberg.org/files/11224/11224-h/11224-h

The primary text supports the first-principle role of general happiness. It does not by itself force this project to choose between every act, rule, or sanction reconstruction of Mill.

### Interpretive boundary

The Stanford Encyclopedia of Philosophy's current entry on Mill distinguishes direct and indirect utilitarian standards, defines act and rule utilitarianism separately, and treats the correct reconstruction of Mill's theory of duty as disputed. It also emphasizes that Mill distinguishes a moral standard from a decision procedure and gives secondary principles substantial practical importance.

- SEP, "Mill's Moral and Political Philosophy", sections 2.6–2.10: https://plato.stanford.edu/entries/mill-moral-political/
- SEP, "The History of Utilitarianism", section 2.3 and the discussion of Mill: https://plato.stanford.edu/entries/utilitarianism-history/
- SEP, "Rule Consequentialism", section 1 and the act/rule distinction: https://plato.stanford.edu/entries/consequentialism-rule/

These sources justify an interpretation-neutral first-principle proposition and simultaneously block treating a direct-act or full-rule criterion as an exact Mill commitment.

## Exact distinctions

| Neighbor | Why it is not the proposed proposition |
| --- | --- |
| `reviewed-NE22-act-consequence-criterion` | NE22 says an individual act's own consequences determine rightness and a better available act rules out a worse act. The proposed proposition does not choose direct act evaluation. |
| `reviewed-NE23-rule-consequence-criterion` | NE23 says consequence-justified rules determine act rightness even when this act alone would do better. The proposed proposition is compatible with this, but does not require it. |
| `reviewed-NE24-welfarist-outcome-value` | NE24 is a thesis about what makes outcomes good in themselves. A first principle of moral justification is a different level of claim. The proposed proposition does not say welfare is the only intrinsic outcome value. |
| `reviewed-NE25-total-welfare-maximization` | NE25 requires the greatest total well-being to decide individual-act rightness, including a specified promise conflict. The proposed proposition does not require total aggregation, individual-act maximization, or that promise-case answer. |
| Rule consequentialism | A rule consequentialist can support the proposed proposition if rules are ultimately justified by general happiness, but support does not establish that rule conformity is the criterion of act rightness. |
| Act consequentialism | An act consequentialist can support the proposed proposition, but support does not establish that acts are evaluated directly or maximized one by one. |
| Sanction or other indirect utilitarian views | These can support the proposed proposition while disagreeing with both NE22 and NE23 about the immediate criterion of duty. |
| Pluralist moral theories | A pluralist who treats happiness as one independent value among several does not support the proposed proposition unless general happiness has final justificatory authority. |
| Deontological or rights-first views | Treating rights or duties as independently authoritative opposes the proposed proposition even if happiness remains morally important. |

## Proposed evidence design

The project should not reuse NE22–NE25 evidence as if it directly measured this proposition. The future rule should require two new authored evidence units that use different judgment tasks. They are conceptually independent units; no psychometric independence is claimed until respondent data justify such a claim.

### Unit A — ultimate-standard conflict

Proposed item: `NEI134@1`  
Proposed construct: `NE26`  
Response type: single choice  
Content kind: contrast  
Scenario group: `general-happiness-ultimate-standard`

Prompt:

> When moral rules or duties conflict and no more specific principle settles the case, which standard should have final authority?

Directional options:

- `general_happiness` — "The general happiness of everyone affected, whether applied directly or through rules justified by their effects on happiness."
- `independent_authority` — "A right or duty can have final authority independently of its effects on general happiness."
- `plural_ultimate` — "Several moral values can be ultimate, so no single standard always decides the conflict."
- `other` — nondirectional.

Rule direction:

- support: `general_happiness`
- oppose: `independent_authority`, `plural_ultimate`
- nondirectional: `other`, no-view, not-understood

Why this is needed: it tests the first-principle conflict role directly without asking whether an individual act or a consequence-justified rule is the immediate criterion.

### Unit B — secondary-principle revision

Proposed item: `NEI135@1`  
Response type: single choice  
Content kind: vignette  
Scenario group: `secondary-principle-ultimate-ground`

Prompt:

> A familiar moral rule is normally useful. Suppose careful evidence shows that revising it would better promote the general happiness, but people disagree on whether the old rule has moral authority independent of that happiness. Which view is closest to yours?

Directional options:

- `happiness_controls` — "General happiness ultimately controls which rule is justified, even if stable rules usually guide conduct without fresh calculation."
- `independent_rule_authority` — "The old rule can remain morally authoritative for a reason that does not ultimately depend on general happiness."
- `plural_balance` — "General happiness and independent moral considerations are both fundamental; neither has final authority in every such conflict."
- `other` — nondirectional.

Rule direction:

- support: `happiness_controls`
- oppose: `independent_rule_authority`, `plural_balance`
- nondirectional: `other`, no-view, not-understood

Why this is independent of Unit A: Unit A asks a general first-principle conflict question; Unit B asks how secondary moral rules retain or lose ultimate authority under a rule-revision scenario. Agreement across both is evidence for the same narrow proposition by distinct tasks rather than paraphrase duplication.

## Proposed rule semantics

Future rule id: `reviewed-NE26-general-happiness-ultimate-standard`

Future scope/proposition:

> General happiness is the ultimate moral standard: moral rules, duties, and judgments are ultimately justified or resolved by their relation to the general happiness, without requiring that standard to be applied directly to each individual act.

Requirements:

- `minimumEvidenceUnits: 2`
- unit ids must be distinct: `NEI134`, `NEI135`
- two supporting units => `supported`
- two opposing units => `opposed`
- one support + one oppose => `mixed_context_dependent`
- one directional unit => `leaned_toward`
- presented but nondirectional / no-view => `insufficient_evidence`
- route omission => `not_measured`

## Positive, negative, mixed, and false-positive cases

### Positive

A respondent selects `general_happiness` on Unit A and `happiness_controls` on Unit B. The future proposition may be supported. This does **not** determine whether the respondent is an act utilitarian, rule utilitarian, sanction utilitarian, hedonist, total utilitarian, average utilitarian, or a Mill follower.

### Negative

A respondent selects `independent_authority` on Unit A and `independent_rule_authority` on Unit B. The future proposition is opposed. Happiness may still be important or even normally decisive; the opposition concerns its claimed status as the ultimate standard.

A respondent selects `plural_ultimate` and `plural_balance`. This also opposes the single-ultimate-standard proposition without labeling the respondent as any one pluralist school.

### Mixed

A respondent gives `general_happiness` on Unit A but `independent_rule_authority` on Unit B, or the reverse directional conflict. Report `mixed_context_dependent`; do not resolve the conflict by importing NE22–NE25 answers.

### False-positive controls

The following must **not** substitute for direct NE26 evidence:

- NE22 supported: direct act consequentialism can maximize something other than happiness.
- NE23 supported: rule consequentialism can justify rules by values other than general happiness.
- NE24 supported: welfare-only outcome value does not itself make happiness the criterion of moral obligation.
- NE25 supported: total-well-being act maximization is narrower and stronger and cannot stand in for the interpretation-neutral first principle.
- generic agreement that consequences matter.
- treating happiness as one important moral value among several.
- using utility as a practical tie-breaker while recognizing independently ultimate duties.
- endorsing stable secondary rules because they are useful while denying that general happiness is their ultimate moral ground.

## Route placement

Initial placement should be **Full only**.

Reasons:

1. NE22–NE25 already form a Full-only diagnostic cluster.
2. The proposition requires two units; adding only one to a short route would create a structurally incapable route.
3. Quick and Standard should not gain two more ethics items solely to make one philosopher candidate profile-ready.
4. Both new units should be separated from each other and from NE22–NE25 items in Full order to reduce immediate consistency pressure. The future regression should require substantial spacing rather than adjacency.

No affinity criterion should be added with this release.

## Claim-level source plan

Future rule source claims should include at least:

1. **Primary Mill — supports**
   - Source: *Utilitarianism*, Chapter II.
   - Claim: Mill presents Utility / the Greatest Happiness Principle as the foundation and standard of morality, while also allowing subordinate principles.
   - Locator: Chapter II, opening statement of the principle; later discussion of secondary principles, conflicting obligations, and an ultimate standard.
   - Use limit: supports the doctrinal target; does not validate item wording or response thresholds.

2. **SEP Mill — supports scope and constrains interpretation**
   - Source: "Mill's Moral and Political Philosophy", sections 2.6–2.10.
   - Claim: scholarship distinguishes the utilitarian first principle from decision procedure and records competing direct, rule, and sanction reconstructions of Mill.
   - Use limit: supports keeping NE26 neutral among those reconstructions.

3. **SEP History of Utilitarianism — context**
   - Source: section on Mill.
   - Claim: Mill is a classical utilitarian, while the act/rule structure of his theory remains a matter of interpretation.
   - Use limit: contextual boundary only.

## Mill reference-profile gate

Even after NE26 is implemented, the allowed profile is still only a scoped internal comparison:

- entity: John Stuart Mill
- claim: general happiness as ultimate moral standard
- exact proposition: `reviewed-NE26-general-happiness-ultimate-standard`
- expected state: `supported`
- publication: `internal_only`
- identity assignment: false
- percentage match: false

Explicit non-entailments must include:

- settled act-utilitarian classification
- settled rule-utilitarian classification
- sanction-utilitarian reconstruction
- NE25 total-welfare promise-case commitment
- NE24 welfare-only outcome value
- a simple quantitative hedonism
- Mill's higher-pleasure doctrine
- Mill's theory of liberty, rights, justice, or political economy
- a complete "Millian" identity

Promotion is forbidden until the active release satisfies all of the following:

1. NE26 exists as a direct public proposition.
2. Both authored units exist at their exact revisions.
3. Full guarantees both distinct evidence units.
4. Quick and Standard correctly return `not_measured`.
5. Rule source claims resolve in the active source ledger.
6. Positive, negative, mixed, missing, one-unit, route-omission, neighbor non-substitution, act/rule-neutrality, source-link, historical, and reference-profile-gate regressions pass.
7. The reference catalog maps Mill only to NE26 and does not import NE22, NE23, NE24, or NE25 as required Mill commitments.

Until then, the PR #37 disposition remains unchanged: **Mill is unprofiled.**
