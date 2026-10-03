# Reference-profile readiness audit

Audit: `reference-readiness-audit-2.0.0`

## Baseline

- Model: `generic-1.17.0-pilot`
- Affinity catalog: `philosophical-affinity-2.8.0`
- Routes: quick 64 (quick-2.8.0); standard 120 (standard-2.8.0); full 251 (full-2.8.0)
- Candidate bank: `0.20.0`
- Source ledger: `0.21.0`

This is an authored coverage audit. Its route counts are available evidence opportunities, not empirical item information or validation.

## Readiness summary

| Candidate | Readiness | Direct on all routes | Exact direct path | Partial | Route-limited | Unmeasured | Missing proposition | Context / unsuitable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Pragmatism — pragmatic-maxim criterion | `READY_FOR_PROFILE_AUTHORING` | 0 | 2 | 0 | 2 | 0 | 0 | 1 |
| Experience-grounded knowledge of the external world — scoped criterion | `READY_FOR_PROFILE_AUTHORING` | 0 | 1 | 0 | 1 | 0 | 1 | 0 |
| Act consequentialism — rightness criterion | `READY_FOR_PROFILE_AUTHORING` | 0 | 1 | 0 | 1 | 0 | 0 | 0 |
| Ethical Egoism — universal self-priority and maximization distinction | `PARTIAL_PROFILE_ONLY` | 0 | 1 | 0 | 1 | 0 | 1 | 0 |
| Objectivism in Ayn Rand's formulation | `PARTIAL_PROFILE_ONLY` | 0 | 1 | 3 | 1 | 0 | 0 | 0 |
| Philosophical anarchism — general political obligation criterion | `READY_FOR_PROFILE_AUTHORING` | 1 | 1 | 1 | 0 | 0 | 0 | 0 |
| Charles S. Peirce — pragmatic maxim and fallibilist inquiry (scoped) | `READY_FOR_PROFILE_AUTHORING` | 0 | 2 | 0 | 2 | 0 | 0 | 0 |
| David Hume — empiricism, induction, and moral sentiment | `RESEARCH_GAPS` | 0 | 0 | 0 | 0 | 0 | 3 | 1 |
| John Stuart Mill — utility criterion (scoped) | `PARTIAL_PROFILE_ONLY` | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| Early Confucian ethics — roles and ritual cultivation | `RESEARCH_GAPS` | 0 | 0 | 1 | 0 | 0 | 2 | 0 |
| Stoic ethics — virtue and indifferent externals | `RESEARCH_GAPS` | 0 | 0 | 1 | 0 | 0 | 2 | 0 |
| Analytic philosophy — context-only category | `CONTEXT_ONLY` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |

## Candidate findings

### Pragmatism — pragmatic-maxim criterion

**Readiness:** `READY_FOR_PROFILE_AUTHORING`

A scoped comparison of the pragmatic method for clarifying disputed ideas, not a complete pragmatist worldview.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| Disputed ideas should be clarified through their conceivable effects on experience or conduct; if two formulations have no conceivable difference in those effects, their apparent conceptual difference is not substantive. | core | `ROUTE_LIMITED` | direct | construct-EP16 | — | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [Charles S. Peirce, How to Make Our Ideas Clear (1878)](https://www.peirce.org/writings/p119.html) | Peirce's pragmatic maxim connects clarification of a conception to conceivable practical bearings. (Sections II–III; primary_text; does not validate the WVS item) | | | |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Pragmatism](https://plato.stanford.edu/entries/pragmatism/) | The pragmatic maxim is used to clarify concepts through conceivable experiential or practical bearings and to expose apparently empty disputes. (Sections 2.1–2.2; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | claim_linked | acad-pragmatism; item validity is assessed separately | | | |
| ↳ Limitation | | | | | This is one criterion, not a complete philosophical system. | | | |
| Inquiry can yield knowledge while remaining open to correction. | major | `ROUTE_LIMITED` | direct | construct-EP15 | — | not available (0/2 units; guaranteed) | capable (2/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Pragmatism](https://plato.stanford.edu/entries/pragmatism/) | Fallibilist inquiry is characteristic of several pragmatist traditions, although it is not unique to pragmatism. (Sections 2–4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Source | | | | [Internet Encyclopedia of Philosophy, Fallibilism](https://iep.utm.edu/fallibil/) | Fallibilism allows knowledge while leaving open the possibility of error. (Overview; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | claim_linked | acad-epistemology, acad-pragmatism, acad-rand-epistemology, iep-fallibilism; item validity is assessed separately | | | |
| ↳ Limitation | | | | | The commitment is shared with many nonpragmatist epistemologies. | | | |
| Pragmatists disagree about realism and theories of truth. | minor | `CONTEXT_ONLY` | none | — | — | — | — | — |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Pragmatism](https://plato.stanford.edu/entries/pragmatism/) | Pragmatist philosophers disagree about how pragmatic methods relate to truth and realism. (Sections 3–5; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | This is internal-variation context, not an individual comparison criterion. | | | |

**False-positive boundaries and non-entailments**:
- usefulness makes a belief true
- rejection of mind-independent reality
- a single pragmatist theory of truth

**Candidate limitations**:
- Classical and later pragmatists disagree about truth and realism.
- Only the pragmatic-maxim criterion is treated as defining in this scoped profile.
- The comparison is authored from doctrine and does not establish a person's identity or the instrument's validity.

**Existing affinity entry:** `pragmatism` in `philosophical-affinity-2.8.0`. Its authored criteria and route opportunities are listed in the JSON report; the audit does not alter the affinity.

### Experience-grounded knowledge of the external world — scoped criterion

**Readiness:** `READY_FOR_PROFILE_AUTHORING`

Whether claims about concrete external reality require experiential evidence; not a complete account of empiricism or concept acquisition.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| Knowledge claims about concrete external reality ultimately require experiential evidence; reasoning alone cannot establish new external-world facts. | core | `ROUTE_LIMITED` | direct | construct-EP20 | — | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) | capable (3/2 units; guaranteed) |
| ↳ Source | | | | [John Locke, An Essay Concerning Human Understanding (1690)](https://www.gutenberg.org/files/10615/10615-h/10615-h.htm) | Locke distinguishes ideas of sensation and reflection as sources of ideas and treats sensation as a source of knowledge of external particulars. (Book II, Chapter I; Book IV, Chapter XI; primary_text; does not validate the WVS item) | | | |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Rationalism vs. Empiricism](https://plato.stanford.edu/entries/rationalism-empiricism/) | Empiricist approaches give experience a substantive role in the justification or acquisition of knowledge, while the tradition contains important variations. (Sections 1–3; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | claim_linked | acad-rand-epistemology, acad-epistemology, sep-rationalism-empiricism; item validity is assessed separately | | | |
| ↳ Limitation | | | | | This criterion concerns external-world factual warrant only. | | | |
| Experience is the ultimate source of all concepts used to describe the external world. | major | `MISSING_PROPOSITION` | none | — | construct-EP20 | — | — | — |
| ↳ Source | | | | [John Locke, An Essay Concerning Human Understanding (1690)](https://www.gutenberg.org/files/10615/10615-h/10615-h.htm) | Locke's account of ideas begins with sensation and reflection, and treats simple ideas as supplied by those sources. (Book II, Chapters I–II; primary_text; does not validate the WVS item) | | | |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Rationalism vs. Empiricism](https://plato.stanford.edu/entries/rationalism-empiricism/) | The experience-versus-reason distinction concerns the source or justification of concepts and knowledge, not only evidence for external-world claims. (Sections 1–3; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | The active external-world warrant proposition does not test the origin of all concepts. | | | |

**False-positive boundaries and non-entailments**:
- all concepts originate in experience
- all knowledge is empirical
- skepticism about the external world

**Candidate limitations**:
- The instrument's proposition is restricted to factual claims about ordinary external reality.
- No current route directly tests the origin of all concepts or the status of mathematics and morality.

**Existing affinity entry:** `sensory-empiricism-about-the-external-world` in `philosophical-affinity-2.8.0`. Its authored criteria and route opportunities are listed in the JSON report; the audit does not alter the affinity.

### Act consequentialism — rightness criterion

**Readiness:** `READY_FOR_PROFILE_AUTHORING`

The direct act-consequence criterion represented by the existing rule; not a complete account of value or a practical decision procedure.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| An act's own consequences determine its moral rightness, and an available act with a better outcome for everyone affected rules out a worse act as permissible. | core | `ROUTE_LIMITED` | direct | reviewed-NE22-act-consequence-criterion | — | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Consequentialism](https://plato.stanford.edu/entries/consequentialism/) | Act consequentialism applies a criterion of rightness directly to an act's consequences; maximizing versions compare available alternatives. (Sections 1–2 and 5; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | claim_linked | sep-act-consequence-criterion; item validity is assessed separately | | | |
| ↳ Limitation | | | | | The WVS proposition is intentionally scoped and the result must retain that scope. | | | |

**False-positive boundaries and non-entailments**:
- utilitarianism
- hedonism
- welfarism
- one required decision procedure

**Candidate limitations**:
- The current proposition tests a defined act-level rightness criterion and does not identify a complete ethical theory.
- The needed item pair appears only on Full.

**Existing affinity entry:** `act-consequentialism-scoped` in `philosophical-affinity-2.8.0`. Its authored criteria and route opportunities are listed in the JSON report; the audit does not alter the affinity.

### Ethical Egoism — universal self-priority and maximization distinction

**Readiness:** `PARTIAL_PROFILE_ONLY`

Separates the normative claim that each agent ought to prioritize their own good from the stronger criterion that rightness is maximization of the agent's good.

**Core gaps**:
- `MISSING_PROPOSITION` — An act is morally right if and only if it best advances the agent's own good.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| Each person morally ought to make their own long-term good the ultimate end of their actions; another person's need alone supplies no independent moral reason. | core | `ROUTE_LIMITED` | direct | construct-NE15 | — | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [Robert Shaver, Egoism](https://plato.stanford.edu/entries/egoism/) | Ethical egoism is a normative view about the agent's own good, distinct from descriptive psychological egoism and rational egoism. (Sections 1–3; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | claim_linked | acad-egoism, acad-rand; item validity is assessed separately | | | |
| ↳ Limitation | | | | | This is one normative criterion; it does not alone establish the stronger maximizing version. | | | |
| An act is morally right if and only if it best advances the agent's own good. | core | `MISSING_PROPOSITION` | none | — | construct-NE16, construct-NE15 | — | — | — |
| ↳ Source | | | | [Robert Shaver, Egoism](https://plato.stanford.edu/entries/egoism/) | Ethical egoist theories differ in their precise accounts of rightness, including whether rightness requires maximizing the agent's good. (Sections 1–3; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | The rational-egoism proposition concerns practical reasons, not moral rightness, and is not a substitute. | | | |

**False-positive boundaries and non-entailments**:
- Descriptive self-interest
- personal projects
- market liberalism
- Rand's complete ethical system

**Candidate limitations**:
- The active direct proposition addresses exclusive moral self-priority, not a complete maximizing rightness criterion.
- The three-item evidence pool contains two near-parallel responses in one evidence unit; minimum evidence cannot treat them as independent corroboration.

**Existing affinity entry:** `ethical-egoism` in `philosophical-affinity-2.8.0`. Its authored criteria and route opportunities are listed in the JSON report; the audit does not alter the affinity.

### Objectivism in Ayn Rand's formulation

**Readiness:** `PARTIAL_PROFILE_ONLY`

A coordinated philosophical system with ethical, epistemological, metaphysical, and political commitments; individual overlaps do not establish the system.

**Core gaps**:
- `PARTIAL` — The agent's rational long-term self-interest is a moral priority within an objective human-life-grounded ethics.
- `PARTIAL` — Perception supplies the foundational contact with the external world and reason integrates perceptual material into knowledge.
- `PARTIAL` — Individual rights constrain political action and are grounded in the nature of human beings as rational agents.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| Objective moral standards are grounded in the requirements of human life and flourishing. | core | `ROUTE_LIMITED` | direct | construct-ME09 | — | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) | capable (3/2 units; guaranteed) |
| ↳ Source | | | | [Ayn Rand, The Objectivist Ethics (1961)](https://courses.aynrand.org/works/the-objectivist-ethics/) | Rand presents life as the standard of value and argues that objective ethics is grounded in the requirements of human life. (The Objectivist Ethics, sections 2–4; primary_text; does not validate the WVS item) | | | |
| ↳ Source | | | | [H. B. Badhwar and R. T. Long, Ayn Rand](https://plato.stanford.edu/entries/ayn-rand/) | Rand's ethical theory grounds value in the requirements of human life and advocates rational egoism. (Section 4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | source_ids_only | acad-rand, acad-egoism, acad-stirner; item validity is assessed separately | | | |
| ↳ Limitation | | | | | This proposition is only one component of the system. | | | |
| The agent's rational long-term self-interest is a moral priority within an objective human-life-grounded ethics. | core | `PARTIAL` | direct | construct-NE15 | — | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [Ayn Rand, The Objectivist Ethics (1961)](https://courses.aynrand.org/works/the-objectivist-ethics/) | Rand argues for rational egoism as a normative ethics grounded in human life, not as a descriptive claim that people always act selfishly. (The Objectivist Ethics, sections 5–8; primary_text; does not validate the WVS item) | | | |
| ↳ Source | | | | [H. B. Badhwar and R. T. Long, Ayn Rand](https://plato.stanford.edu/entries/ayn-rand/) | Rand defends rational egoism as part of a wider ethical system. (Section 4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | claim_linked | acad-egoism, acad-rand; item validity is assessed separately | | | |
| ↳ Limitation | | | | | NE15 does not require the specific rationality and life-grounding elements in this claim. | | | |
| Perception supplies the foundational contact with the external world and reason integrates perceptual material into knowledge. | core | `PARTIAL` | direct | construct-EP20 | — | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) | capable (3/2 units; guaranteed) |
| ↳ Source | | | | [H. B. Badhwar and R. T. Long, Ayn Rand](https://plato.stanford.edu/entries/ayn-rand/) | Rand's epistemology treats perception as the starting point of awareness and reason as the faculty that identifies and integrates perceptual material. (Section 3; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | claim_linked | acad-rand-epistemology, acad-epistemology, sep-rationalism-empiricism; item validity is assessed separately | | | |
| ↳ Limitation | | | | | The active proposition concerns external-world factual warrant, not Rand's full theory of perception and reason. | | | |
| Individual rights constrain political action and are grounded in the nature of human beings as rational agents. | core | `PARTIAL` | direct | ph-rights-constraints | — | capable (2/2 units; guaranteed) | capable (2/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [H. B. Badhwar and R. T. Long, Ayn Rand](https://plato.stanford.edu/entries/ayn-rand/) | Rand defends individual rights as moral principles that protect individual action and limit the use of force. (Section 5; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | source_ids_only | acad-rights, gen-deontology; item validity is assessed separately | | | |
| ↳ Limitation | | | | | The WVS proposition concerns rights constraining aggregate benefit and does not encode Rand's full derivation of rights. | | | |

**False-positive boundaries and non-entailments**:
- Free-market preference
- atheism
- moral realism alone
- self-interest alone
- sensory evidence alone

**Candidate limitations**:
- Several defining Objectivist doctrines are not directly measured by current routes.
- The surfaced criteria are a limited set and do not reconstruct Rand's complete system.

**Existing affinity entry:** `objectivism-rand` in `philosophical-affinity-2.8.0`. Its authored criteria and route opportunities are listed in the JSON report; the audit does not alter the affinity.

### Philosophical anarchism — general political obligation criterion

**Readiness:** `READY_FOR_PROFILE_AUTHORING`

A narrow comparison of whether law itself generates a general content-independent moral duty to obey; not a political program of immediate abolition.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| Law does not normally create a general moral duty to obey merely because it is law. | core | `DIRECT` | direct | legacy-philosophical-anarchism-no-general-obedience | — | capable (3/2 units; guaranteed) | capable (3/2 units; guaranteed) | capable (3/2 units; guaranteed) |
| ↳ Source | | | | [Dagger and Lefkowitz, Political Obligation](https://plato.stanford.edu/entries/political-obligation/) | Philosophical anarchists deny that there is a general moral duty to obey the law merely because it is law, while the scope and implications of that denial are disputed. (Sections 1 and 4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Source | | | | [Andrew Fiala, Anarchism](https://plato.stanford.edu/entries/anarchism/) | Philosophical anarchism concerns the legitimacy of political authority and is distinct from a simple political preference for disorder. (Section 2; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | source_ids_only | acad-obligation, acad-legitimacy, acad-simmons; item validity is assessed separately | | | |
| ↳ Limitation | | | | | The criterion is intentionally limited to general content-independent political obligation. | | | |
| The state's general standing to issue binding content-independent commands lacks adequate justification, while institutions may still have practical value. | major | `PARTIAL` | direct | construct-PL31 | — | not available (0/2 units; guaranteed) | capable (2/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [Dagger and Lefkowitz, Political Obligation](https://plato.stanford.edu/entries/political-obligation/) | Arguments against general political obligation do not by themselves entail that institutions have no practical value or that every state should immediately be abolished. (Sections 1–5; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | source_ids_only | acad-obligation, acad-legitimacy, acad-simmons; item validity is assessed separately | | | |
| ↳ Limitation | | | | | The active proposition measures a narrow institutional-value distinction, not the full legitimacy debate. | | | |

**False-positive boundaries and non-entailments**:
- Immediate abolition of all institutions
- rejection of useful laws
- political violence

**Candidate limitations**:
- Practical endorsement of institutions and rejection of general obedience can coexist.
- The broader grounds of state legitimacy and abolition remain disputed or undermeasured.

**Existing affinity entry:** `philosophical-anarchism` in `philosophical-affinity-2.8.0`. Its authored criteria and route opportunities are listed in the JSON report; the audit does not alter the affinity.

### Charles S. Peirce — pragmatic maxim and fallibilist inquiry (scoped)

**Readiness:** `READY_FOR_PROFILE_AUTHORING`

A small comparison of Peirce's pragmatic maxim and fallibilism; not a complete Peircean profile.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| The meaning of a conception is clarified by considering conceivable practical bearings. | core | `ROUTE_LIMITED` | direct | construct-EP16 | — | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [Charles S. Peirce, How to Make Our Ideas Clear (1878)](https://www.peirce.org/writings/p119.html) | Peirce formulates the pragmatic maxim as a rule for attaining clear apprehension of concepts through conceivable practical effects. (Sections II–III; primary_text; does not validate the WVS item) | | | |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Charles Sanders Peirce](https://plato.stanford.edu/entries/peirce/) | Peirce's pragmatic maxim is central to his method and theory of meaning. (Sections 3–4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | claim_linked | acad-pragmatism; item validity is assessed separately | | | |
| ↳ Limitation | | | | | The current comparison tests a narrow methodological commitment. | | | |
| Inquiry can yield knowledge while remaining open to correction. | major | `ROUTE_LIMITED` | direct | construct-EP15 | — | not available (0/2 units; guaranteed) | capable (2/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Charles Sanders Peirce](https://plato.stanford.edu/entries/peirce/) | Peirce's fallibilism holds that no empirical claim is beyond possible correction, without requiring wholesale skepticism. (Sections 5–6; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | claim_linked | acad-epistemology, acad-pragmatism, acad-rand-epistemology, iep-fallibilism; item validity is assessed separately | | | |
| ↳ Limitation | | | | | Fallibilism is shared across philosophical positions. | | | |

**False-positive boundaries and non-entailments**:
- Peirce's complete theory of signs
- synechism or tychism
- a specific theory of truth inferred from a pragmatic answer

**Candidate limitations**:
- The pragmatic maxim is directly assessable only on Full.
- Peirce's semiotics, realism, and other defining areas are not covered by this scoped audit.

### David Hume — empiricism, induction, and moral sentiment

**Readiness:** `RESEARCH_GAPS`

Selected themes in Hume's theory of ideas, causal inference, and moral judgment; interpretive controversies remain open.

**Core gaps**:
- `MISSING_PROPOSITION` — Ideas are ultimately derived from impressions, while complex ideas may combine or rearrange experiential materials.
- `MISSING_PROPOSITION` — Reason alone does not demonstrate that observed regularities must continue in unobserved cases; customary expectation explains ordinary inductive inference.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| Ideas are ultimately derived from impressions, while complex ideas may combine or rearrange experiential materials. | core | `MISSING_PROPOSITION` | none | — | construct-EP20 | — | — | — |
| ↳ Source | | | | [David Hume, A Treatise of Human Nature (1739–40)](https://davidhume.org/texts/t/1/1/full) | Hume's Copy Principle says simple ideas are derived from prior impressions and complex ideas are composed from simple ideas. (Book I, Part I, Section 1; primary_text; does not validate the WVS item) | | | |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, David Hume](https://plato.stanford.edu/entries/hume/) | Hume distinguishes impressions and ideas and uses their relation as a central empiricist principle. (Sections 1–2; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | The active EP20 proposition addresses external-world warrant, not the origin of all ideas. | | | |
| Reason alone does not demonstrate that observed regularities must continue in unobserved cases; customary expectation explains ordinary inductive inference. | core | `MISSING_PROPOSITION` | none | — | — | — | — | — |
| ↳ Source | | | | [David Hume, An Enquiry Concerning Human Understanding (1748)](https://davidhume.org/texts/e/4) | Hume argues that conclusions extending beyond present testimony and memory rely on causal reasoning, whose inference from past to future is not demonstratively justified by reason alone. (Sections IV–V; primary_text; does not validate the WVS item) | | | |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, David Hume](https://plato.stanford.edu/entries/hume/) | Hume's treatment of induction distinguishes demonstrative proof, probable reasoning, and customary expectation. (Sections 4–5; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | No current public proposition targets the justification of enumerative induction. | | | |
| Moral distinctions depend on sentiment and are not derived from reason alone. | major | `MISSING_PROPOSITION` | none | — | — | — | — | — |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Hume's Moral Philosophy](https://plato.stanford.edu/entries/hume-moral/) | Hume argues that moral distinctions arise from moral sentiments rather than reason alone, while scholars dispute how this bears on the cognitive status of moral judgment. (Sections 3–7; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Source | | | | [David Hume, A Treatise of Human Nature (1739–40)](https://davidhume.org/texts/t/1/1/full) | Hume argues that moral distinctions are not derived from reason alone and analyzes moral approval and disapproval as sentiments. (Book III, Part I, Sections 1–2; primary_text; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | The interpretive relation between sentiment, belief, and truth remains contested. | | | |
| Hume's mitigated skepticism limits speculative inquiry while retaining ordinary beliefs and practices. | minor | `CONTEXT_ONLY` | none | — | — | — | — | — |
| ↳ Source | | | | [David Hume, An Enquiry Concerning Human Understanding (1748), Section XII](https://davidhume.org/texts/e/12) | Hume recommends a mitigated form of skepticism that moderates inquiry and returns judgment to common life rather than suspending all ordinary belief. (Section XII, Part III; primary_text; does not validate the WVS item) | | | |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, David Hume](https://plato.stanford.edu/entries/hume/) | Hume distinguishes mitigated skepticism from excessive skepticism and treats it as a restraint on philosophical inquiry. (Section 6; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | This is contextual scholarship, not a directly measured respondent criterion. | | | |

**False-positive boundaries and non-entailments**:
- Global skepticism
- emotivism as an uncontested interpretation
- the external-world empiricism proposition as a full Hume profile

**Candidate limitations**:
- Current external-world warrant evidence does not test the Copy Principle.
- No active proposition assesses Hume's problem of induction or the role of moral sentiment.
- Scholars disagree about the scope of Hume's skeptical and noncognitivist conclusions.

### John Stuart Mill — utility criterion (scoped)

**Readiness:** `PARTIAL_PROFILE_ONLY`

A selected comparison of the greatest-happiness principle and impartial concern; not a complete reconstruction of Mill's ethics or political philosophy.

**Core gaps**:
- `PARTIAL` — The greatest happiness principle treats the promotion of general happiness as the ultimate moral standard.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| The greatest happiness principle treats the promotion of general happiness as the ultimate moral standard. | core | `PARTIAL` | direct | reviewed-NE25-total-welfare-maximization | — | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [John Stuart Mill, Utilitarianism (1861), Chapter II](https://www.earlymoderntexts.com/assets/pdfs/mill1863_1.pdf) | Mill states that actions are right in proportion as they promote happiness and wrong as they produce its reverse. (Chapter II; primary_text; does not validate the WVS item) | | | |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, The History of Utilitarianism](https://plato.stanford.edu/entries/utilitarianism-history/) | Mill is commonly read as a utilitarian, though scholars disagree about whether his criterion is best classified as act or rule consequentialist. (Sections 3–5; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | claim_linked | sep-act-consequence-criterion, sep-promises-act-rule, sep-welfarism-outcome-value; item validity is assessed separately | | | |
| ↳ Limitation | | | | | NE25 tests a general rule plus one specified promise conflict, not the whole greatest-happiness principle. | | | |
| Moral rightness is ultimately determined by the consequences of individual acts rather than by conformity to a consequence-justified code of rules. | major | `PARTIAL` | direct | reviewed-NE22-act-consequence-criterion | — | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, The History of Utilitarianism](https://plato.stanford.edu/entries/utilitarianism-history/) | Some scholars interpret Mill's greatest-happiness criterion as act-utilitarian, while other interpretations emphasize rules and secondary principles. (Sections 3–5; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | claim_linked | sep-act-consequence-criterion; item validity is assessed separately | | | |
| ↳ Limitation | | | | | The SEP records interpretive disagreement; this is an explicitly partial reading, not a canonical classification. | | | |

**False-positive boundaries and non-entailments**:
- One settled scholarly classification of Mill as act or rule utilitarian
- hedonism as a simple quantitative view
- the whole of Mill's political philosophy

**Candidate limitations**:
- Mill's account is interpreted in multiple ways; the audit uses scoped doctrinal claims.
- Current relevant rule pairs appear on Full.

### Early Confucian ethics — roles and ritual cultivation

**Readiness:** `RESEARCH_GAPS`

Early Confucian sources centered on the Analects; not a claim about every later Confucian tradition.

**Core gaps**:
- `MISSING_PROPOSITION` — Ritual practice can cultivate ethical dispositions and shape appropriate conduct within relationships.
- `MISSING_PROPOSITION` — Ethical responsibilities and virtues can be shaped by particular familial and social roles.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| Ritual practice can cultivate ethical dispositions and shape appropriate conduct within relationships. | core | `MISSING_PROPOSITION` | none | — | — | — | — | — |
| ↳ Source | | | | [Confucius, Analects, translated by Robert Eno](https://scholarworks.iu.edu/dspace/items/12df6d92-4ac2-47d4-8c20-2f8018f2555d/full) | The Analects presents ritual practice as part of cultivated and context-sensitive ethical conduct. (Analects 12.1; 2.3; 2.5–2.8; primary_text; does not validate the WVS item) | | | |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Chinese Ethics](https://plato.stanford.edu/entries/ethics-chinese/) | Early Confucian ethical thought gives li and role-shaped practice an important place, though their relation to ren and virtue is debated. (Sections 2–4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | No active proposition measures ritual as ethical cultivation. | | | |
| Ethical responsibilities and virtues can be shaped by particular familial and social roles. | core | `MISSING_PROPOSITION` | none | — | audit2-SO03-relational-self, moral-concern-authority | — | — | — |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Confucius](https://plato.stanford.edu/entries/confucius/) | Confucius's ethical teaching emphasizes relationships, role-appropriate conduct, and cultivated virtues. (Sections 2–4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Source | | | | [Confucius, Analects, translated by Robert Eno](https://scholarworks.iu.edu/dspace/items/12df6d92-4ac2-47d4-8c20-2f8018f2555d/full) | Analects passages connect filial and social roles with cultivated conduct and reciprocal expectations. (Analects 2.5–2.8; 12.1; primary_text; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | SO03 concerns aspects of personal identity, not the content of moral obligations by role. Moral-concern-authority asks about generic role-attached duties, but does not encode Confucian reciprocity, ritual, or cultivation. | | | |
| Relationships and social roles importantly constitute aspects of personal identity. | major | `PARTIAL` | direct | audit2-SO03-relational-self | — | capable (2/2 units; guaranteed) | capable (2/2 units; guaranteed) | capable (2/2 units; guaranteed) |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Confucius](https://plato.stanford.edu/entries/confucius/) | Early Confucian ethics gives relationships and role-shaped conduct a central place, although this does not settle the metaphysics of personal identity. (Sections 2–4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | source_ids_only | audit-selfconstrual; item validity is assessed separately | | | |
| ↳ Limitation | | | | | This is only a related relational-self proposition; it does not test ritual or role-specific moral obligations. | | | |

**False-positive boundaries and non-entailments**:
- Authoritarianism
- uncritical obedience
- political collectivism
- all later Confucian doctrine

**Candidate limitations**:
- Relational self-construal is not equivalent to Confucian role ethics.
- Ritual, reciprocal role duties, and their ethical function are not directly tested by an active public proposition.
- Interpretations of ren, li, and role ethics vary.

### Stoic ethics — virtue and indifferent externals

**Readiness:** `RESEARCH_GAPS`

The shared Hellenistic Stoic ethical thesis, with internal distinctions among value, preferred indifferents, and the good life.

**Core gaps**:
- `MISSING_PROPOSITION` — Virtue is the only genuine good and is sufficient for a flourishing life.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| Virtue is the only genuine good and is sufficient for a flourishing life. | core | `MISSING_PROPOSITION` | none | — | character-counts | — | — | — |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Stoicism](https://plato.stanford.edu/entries/stoicism/) | The Stoics hold that virtue is the only genuine good and is necessary and sufficient for eudaimonia. (Section 4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Source | | | | [Cicero, De Finibus, Book III](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Cicero/de_Finibus/3*.html) | Cicero's report of Stoic ethics distinguishes virtue as the only good from preferred externals. (Book III, sections 21 and 42–47; primary_text; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | NE03 says character contributes to assessment; it does not assert virtue is the sole good and has no active route evidence. | | | |
| Health, wealth, and reputation are not genuine goods or evils, although some externals may be preferred in choice. | major | `MISSING_PROPOSITION` | none | — | — | — | — | — |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Stoicism](https://plato.stanford.edu/entries/stoicism/) | Stoics classify health, wealth, and reputation as indifferent with respect to happiness, while allowing preferred indifferents to guide selection. (Section 4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Source | | | | [Cicero, De Finibus, Book III](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Cicero/de_Finibus/3*.html) | Stoic ethics distinguishes what is good from preferred things that are not themselves goods. (Book III, sections 50–55; primary_text; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | No active proposition distinguishes moral value from selection among preferred indifferents. | | | |
| Character contributes to moral assessment. | minor | `PARTIAL` | direct | character-counts | — | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) | not available (0/2 units; guaranteed) |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Stoicism](https://plato.stanford.edu/entries/stoicism/) | Stoic ethics places virtue at the center of moral assessment, but this broad statement does not express the Stoic claim that virtue alone is good. (Sections 3–4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ WVS source path | | | | source_ids_only | gen-virtue; item validity is assessed separately | | | |
| ↳ Limitation | | | | | The current rule lacks public route evidence and is much weaker than the Stoic criterion. | | | |

**False-positive boundaries and non-entailments**:
- Emotional numbness
- passivity
- endurance as the sole virtue
- indifference to all practical choices

**Candidate limitations**:
- The public model has no direct proposition that virtue alone is good or sufficient for flourishing.
- Character contributing to moral assessment is not the Stoic thesis and is not route-assessable.

### Analytic philosophy — context-only category

**Readiness:** `CONTEXT_ONLY`

A broad historical and methodological tradition, not a single substantive doctrine for respondent comparison.

| Claim | Role | Mapping | Interpretation path | WVS proposition | Adjacent propositions | Quick | Standard | Full |
|---|---|---|---|---|---|---|---|---|---|
| Analytic philosophy is a historically related but internally diverse methodological tradition rather than a single respondent-level set of substantive commitments. | minor | `CONTEXT_ONLY` | none | — | — | — | — | — |
| ↳ Source | | | | [Stanford Encyclopedia of Philosophy, Analysis](https://plato.stanford.edu/entries/analysis/) | Analytic philosophy contains varied conceptions of analysis and its defining methodological feature is not reducible to one uniform practice. (Section 6; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Source | | | | [Internet Encyclopedia of Philosophy, Analytic Philosophy](https://iep.utm.edu/analytic-philosophy/) | The analytic movement's methods and conceptions changed over time and do not establish a unified substantive doctrine. (Sections 1–4; signed_scholarly_synthesis; does not validate the WVS item) | | | |
| ↳ Limitation | | | | | This is a historiographical boundary, not a respondent comparison claim. | | | |

**False-positive boundaries and non-entailments**:
- One shared metaphysics or ethics
- a single required philosophical method

**Candidate limitations**:
- The label covers diverse methods and substantive positions; the candidate is retained only to test the audit's context-only disposition.

## Existing item leads reviewed

These items are not active evidence for the listed candidate claim unless an active rule and route explicitly provide that path. A candidate item by itself does not make a proposition measurable.

- `EPI104@1` (candidate; present on no public route; active public rule refs: none): This unadministered candidate directly approaches the pragmatic maxim and could be reviewed as an additional evidence unit or route discriminator. It does not currently contribute to the public rule; EPI103 and EPI123 form the governed Full-route path.
- `EPI105@1` (candidate; present on no public route; active public rule refs: none): This unadministered candidate is an overbroad reverse-key statement: the pragmatic maxim does not imply that every philosophical distinction is settled by experiential consequences. It should not be used as an opposition pole without semantic review.
- `NEI103@1` (candidate; present on no public route; active public rule refs: construct-NE16): NEI103–NEI105 target rational egoism about practical reasons. They are not in public routes and cannot establish whether moral rightness requires maximizing the agent's own good.
- `NEI121@1` (candidate; present on full; active public rule refs: construct-NE15): This scenario is already used by construct-NE15 on Full and can help assess exclusive moral self-priority. It does not test whether rightness is constituted by maximizing the agent's own good.
- `MFI005@2` (candidate; present on no public route; active public rule refs: none): This broad candidate wording does not distinguish ritual cultivation, reciprocal role duties, or Confucian role ethics. It is not administered on a public route.
- `MFI017@1` (candidate; present on quick, standard, full; active public rule refs: moral-concern-authority): MFI017 and MFI027 feed the public moral-concern-authority proposition on all routes. This supports a general role-duty criterion, but not Confucian-specific reciprocal roles, ritual, or ethical cultivation.
- `MFI027@1` (candidate; present on quick, standard, full; active public rule refs: moral-concern-authority): MFI027 is paired with MFI017 under the public moral-concern-authority rule on all routes. It does not identify Confucian ritual or establish a general Confucian doctrine of role ethics.
- `VAI027@1` (candidate; present on full; active public rule refs: priority-VA11): The Full route uses this as a value-priority response. It does not measure ritual as ethical cultivation or role-specific moral duties.

## Distinctions that would require future review

These are content-gap descriptions, not proposed item wording or an instruction to expand the bank. A new item is justified only if existing administered items and governed interpretations cannot distinguish the named alternatives.

- **tradition-ethical-egoism:** Moral rightness as maximizing the agent's own good versus universal self-priority without a maximizing rightness criterion. NEI121 on Full tests whether another's need gives an independent moral reason; NEI103–NEI105 concern practical reasons. Neither directly asks whether rightness is constituted by maximizing the agent's own good.
- **philosopher-hume:** The justification and psychological basis of inductive inference. No active or reviewed candidate public item isolates Hume's problem of induction from generic evidence, fallibilism, or external-world warrant. Existing temporal and causal items address different distinctions.
- **tradition-early-confucian-ethics:** Ritual as ethical cultivation and reciprocal responsibilities tied to social roles. MFI017/MFI027 measure generic moral relevance of role-attached duties and SOI003/SOI027 measure relational aspects of identity. These are useful partial evidence, not Confucian ritual, reciprocity, or cultivation; MFI005 and VAI027 do not close that gap.
- **tradition-stoic-ethics:** Virtue as the only genuine good and the status of preferred indifferents. The active character-counts proposition and ME09 human-life grounding do not establish virtue as the only good; candidate MFI004 concerns group loyalty as a virtue, not the Stoic value thesis.
- **tradition-objectivism-rand:** Rand's specific account of rational egoism, rights, and political authority. Existing life-grounding, self-priority, market, and generic rights propositions do not establish Objectivism's integrated ethical and political derivation.

## Interpretation limits

- `DIRECT` means the exact authored rule path has enough guaranteed distinct evidence units on all three routes. `ROUTE_LIMITED` means an exact active rule path can be used on some routes but not all. Neither means the claim has been empirically validated.
- Direct versus derived describes the rule path; `PARTIAL` is not a substitute for the full candidate claim.
- Conditional evidence is reported separately as possible versus guaranteed route opportunity. A branch prerequisite is never silently counted as available to every respondent.
- `UNMEASURED` refers to a distinction recognized by the current model but unavailable through active public routes.
- `MISSING_PROPOSITION` means the current proposition model does not adequately represent the distinction.
- `CONTEXT_ONLY` and `UNSUITABLE` are not respondent comparison criteria.
- Several reference profiles can overlap; this audit selects no single tradition or person.
