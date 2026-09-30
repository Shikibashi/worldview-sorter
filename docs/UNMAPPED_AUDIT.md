# Audit of the 49 previously unmapped active constructs

This audit starts from generic-0.2.0 and deliberately does not force 100% coverage. The 562-item bank is unchanged.

## Decision counts

- **ready_existing_items**: 27
- **needs_new_discriminating_items**: 2
- **remain_derived**: 5
- **remain_research_only**: 7
- **split_or_deprecate**: 8

Thirty-two of the 49 constructs now have at least one narrowly scoped interpretation rule. Seventeen remain intentionally unresolved at the model level.

## Construct decisions

### ME07 — Metaethical family
**Decision:** remain_derived
Metaethical family should remain a derived synthesis over independently measured metaethical commitments; MEI005 is diagnostic, not a standalone family scale.
Academic basis: [Pölzler (2018): How to Measure Moral Realism](https://doi.org/10.1007/s13164-018-0401-8); [Driving the Chariot North: How Experimental Metaethics Has Gone South with Error Theory and Non-Cognitivism](https://doi.org/10.1007/s13164-026-00835-x); [Moral Realism](https://plato.stanford.edu/entries/moral-realism/); [Moral Anti-Realism](https://plato.stanford.edu/entries/moral-anti-realism/); [Moral Cognitivism vs. Non-Cognitivism](https://plato.stanford.edu/entries/moral-cognitivism/)
Existing items: MEI005

### MF07 — Liberty / opposition to domination
**Decision:** remain_research_only
Liberty/opposition-to-domination is theoretically interesting, but it is not part of the standard MFQ-2 six-foundation model and the current items are original exploratory content.
Academic basis: [Atari et al. (2023): Morality Beyond the WEIRD: How the Nomological Network of Morality Varies Across Cultures](https://pubmed.ncbi.nlm.nih.gov/37589704/); [Iyer et al. (2012): Understanding Libertarian Morality](https://doi.org/10.1371/journal.pone.0042366)
Existing items: MFI019, MFI020, MFI021, MFI022

### EP02 — Knowledge complexity
**Decision:** ready_existing_items
Existing items directly ask whether knowledge is simple versus interconnected/developing; interpret only this narrow personal-epistemology proposition.
Academic basis: [Schommer (1990): Effects of Beliefs About the Nature of Knowledge on Comprehension](https://doi.org/10.1037/0022-0663.82.3.498)
Existing items: EPI009, EPI014, EPI028
Accepted rules: audit-EP02-complex-knowledge

### EP03 — Attainability of truth
**Decision:** needs_new_discriminating_items
EPI015 was already excluded and the remaining material does not provide two independent negative indicators of truth attainability without conflating approximation, skepticism, and conventionalism.
Academic basis: [Stanford Encyclopedia of Philosophy: Epistemology](https://plato.stanford.edu/entries/epistemology/)
Existing items: EPI010, EPI015, EPI029

### EP05 — Rational / a priori reliance
**Decision:** ready_existing_items
Two direct, opposing items support a narrow a-priori-justification interpretation; EPI025 remains excluded as a knowledge/trivia recognition question.
Academic basis: [A Priori Justification and Knowledge](https://plato.stanford.edu/entries/apriori/)
Existing items: EPI006, EPI017, EPI025
Accepted rules: audit-EP05-apriori

### EP06 — Scientific-method reliance
**Decision:** ready_existing_items
Public systematic testability can be interpreted as an epistemic preference, without claiming science is the only source of knowledge.
Academic basis: [Scientific Objectivity](https://plato.stanford.edu/entries/scientific-objectivity/); [Stanford Encyclopedia of Philosophy: Epistemology](https://plato.stanford.edu/entries/epistemology/)
Existing items: EPI004, EPI007, EPI026
Accepted rules: audit-EP06-testability

### EP10 — Revelation as epistemic source
**Decision:** ready_existing_items
Current items directly ask whether purported revelation can provide factual justification; this is distinct from revelation's moral or political authority.
Academic basis: [Divine Revelation](https://plato.stanford.edu/entries/divine-revelation/)
Existing items: EPI012, EPI021, EPI032
Accepted rules: audit-EP10-revelation

### EP11 — External-world stance
**Decision:** split_or_deprecate
The current construct conflates external-world metaphysics, perceptual directness, and skepticism. Retain narrower external-world-independence and skepticism interpretations; do not emit one categorical label.
Academic basis: [Epistemological Problems of Perception](https://plato.stanford.edu/entries/perception-episprob/)
Existing items: EPI034, EPI035, EPI036, EPI037
Accepted rules: audit-EP11-external-world, audit-EP11-skepticism

### OM08 — Metaontology
**Decision:** split_or_deprecate
Substantive-versus-deflationary attitudes can be reported, but framework relativity and verbalism should not be collapsed into one categorical metaontology label.
Academic basis: [Amie L. Thomasson (2015): Ontology Made Easy](https://global.oup.com/academic/product/ontology-made-easy-9780190878665); [Marschall (2021; online 2019): Easy Ontology, Quantification, and Realism](https://doi.org/10.1007/s11229-019-02463-8)
Existing items: OMI022, OMI023, OMI024
Accepted rules: audit-OM08-deflationary, audit-OM08-substantive

### MS07 — Identity under transformation
**Decision:** remain_derived
Identity-under-transformation is appropriately a derived pattern over continuity and transformation cases; one teleportation item cannot support a direct scale.
Academic basis: [Personal Identity](https://plato.stanford.edu/entries/identity-personal/)
Existing items: MSI005

### AH01 — Free-will belief
**Decision:** needs_new_discriminating_items
Current free-will items partly encode compatibilist conditions, so disagreement may mean incompatibilism rather than disbelief in free will.
Academic basis: [Free Will Inventory](https://pubmed.ncbi.nlm.nih.gov/24561311/); [Free Will](https://plato.stanford.edu/entries/freewill/)
Existing items: AHI001, AHI012, AHI023, AHI034

### AH03 — Moral-responsibility belief
**Decision:** ready_existing_items
Current items directly address basic/desert-entailing responsibility and manipulation; keep distinct from forward-looking responsibility.
Academic basis: [Moral Responsibility](https://plato.stanford.edu/entries/moral-responsibility/)
Existing items: AHI003, AHI014, AHI025, AHI036
Accepted rules: audit-AH03-basic-desert

### AH04 — Baseline human benevolence
**Decision:** split_or_deprecate
The broad 'baseline benevolence' label overreaches. Existing direct items can support only the narrower claim that humans are capable of genuinely other-regarding motivation.
Academic basis: [Altruism](https://plato.stanford.edu/entries/altruism/)
Existing items: AHI006, AHI015, AHI026
Accepted rules: audit-AH04-altruistic-capacity

### AH05 — Baseline human selfishness / competition
**Decision:** split_or_deprecate
Self-interest prevalence and competition are different. Psychological egoism is already represented by AH13 and social competition by SO08; do not score this bundled construct as one worldview dimension.
Academic basis: [Altruism](https://plato.stanford.edu/entries/altruism/); [Robert Shaver: Egoism](https://plato.stanford.edu/entries/egoism/); [Murphy, Ackermann & Handgraaf (2011): Measuring Social Value Orientation](https://doi.org/10.2139/ssrn.1804189)
Existing items: AHI007, AHI016, AHI027

### AH06 — Human-nature mutability
**Decision:** ready_existing_items
Existing items directly concern malleability of human dispositions; keep separate from whether causes are biological or environmental.
Academic basis: [Levy, Stroessner & Dweck (1998): Stereotype Formation and Endorsement](https://doi.org/10.1037/0022-3514.74.6.1421); [Human Nature](https://plato.stanford.edu/entries/human-nature/)
Existing items: AHI004, AHI008, AHI028
Accepted rules: audit-AH06-malleability

### AH07 — Human-nature complexity
**Decision:** remain_research_only
A generic preference for multi-causal explanation is a methodological outlook with no clear validated worldview construct here; retain for research only.
Academic basis: [Human Nature](https://plato.stanford.edu/entries/human-nature/)
Existing items: AHI009, AHI017, AHI029

### AH08 — Biological causal attribution
**Decision:** ready_existing_items
Interpret only the reported belief that biological/inherited factors can make substantial causal contributions; do not infer immutability or normativity.
Academic basis: [Human Nature](https://plato.stanford.edu/entries/human-nature/)
Existing items: AHI010, AHI018, AHI030
Accepted rules: audit-AH08-biological

### AH09 — Environmental / social causal attribution
**Decision:** ready_existing_items
Interpret only the reported belief that social/environmental factors can substantially shape behavior; do not infer blank-slate views.
Academic basis: [Human Nature](https://plato.stanford.edu/entries/human-nature/)
Existing items: AHI004, AHI019, AHI022, AHI031
Accepted rules: audit-AH09-environmental

### AH12 — Agency theory family
**Decision:** remain_derived
Compatibilist/libertarian/skeptical family classification must remain derived from free-will, determinism, and responsibility answers.
Academic basis: [Free Will Inventory](https://pubmed.ncbi.nlm.nih.gov/24561311/); [Free Will](https://plato.stanford.edu/entries/freewill/)
Existing items: none

### RC02 — Personal / agentic deity
**Decision:** ready_existing_items
Conditional questions directly distinguish personal/agentic from impersonal divinity; only interpret when relevant branch prerequisites are satisfied.
Academic basis: [Divine Providence](https://plato.stanford.edu/entries/providence-divine/); [Atheism and Agnosticism](https://plato.stanford.edu/entries/atheism-agnosticism/)
Existing items: RCI002, RCI015, RCI025
Accepted rules: audit-RC02-agentic-divinity

### RC04 — Divine / supernatural intervention
**Decision:** ready_existing_items
Current items directly address whether supernatural agency can intervene in ordinary events.
Academic basis: [Degelman & Lynn (1995): Belief in Divine Intervention Scale](https://doi.org/10.1177/009164719502300104); [Divine Providence](https://plato.stanford.edu/entries/providence-divine/)
Existing items: RCI009, RCI016, RCI026
Accepted rules: audit-RC04-intervention

### RC05 — Miraculous intervention
**Decision:** ready_existing_items
Current items directly address miracles, while distinguishing unexplained natural events from miracle claims.
Academic basis: [Miracles](https://plato.stanford.edu/entries/miracles/)
Existing items: RCI010, RCI017, RCI027
Accepted rules: audit-RC05-miracles

### RC06 — Revelatory authority
**Decision:** ready_existing_items
Current items support a narrow claim about purported revelation having authority for belief or conduct, distinct from public-law authority.
Academic basis: [Divine Revelation](https://plato.stanford.edu/entries/divine-revelation/)
Existing items: RCI011, RCI018, RCI028
Accepted rules: audit-RC06-revelatory-authority

### RC11 — Divinity model
**Decision:** remain_derived
Theism, deism, pantheism, panentheism, and impersonal divinity are a family of alternatives. Keep the family descriptive/derived rather than a single score.
Academic basis: [Atheism and Agnosticism](https://plato.stanford.edu/entries/atheism-agnosticism/)
Existing items: RCI001, RCI031, RCI032, RCI033, RCI034, RCI035

### EX02 — Objective-purpose source
**Decision:** split_or_deprecate
Designer-grounded and non-designer sources of objective purpose should be separate commitments, not one categorical score.
Academic basis: [The Meaning of Life](https://plato.stanford.edu/entries/life-meaning/)
Existing items: EXI012, EXI013, EXI014
Accepted rules: audit-EX02-designer-purpose, audit-EX02-nondesigner-purpose

### EX04 — Existential nihilism
**Decision:** ready_existing_items
Current items directly distinguish denial of objective/inherent meaning from alternative objective or constructed sources.
Academic basis: [The Meaning of Life](https://plato.stanford.edu/entries/life-meaning/)
Existing items: EXI003, EXI006, EXI011
Accepted rules: audit-EX04-nihilism

### EX05 — World safety
**Decision:** remain_research_only
World-safety is a validated Primal World Beliefs construct, but these are custom items and should remain explicitly exploratory until calibrated.
Academic basis: [Primal World Beliefs](https://pubmed.ncbi.nlm.nih.gov/30299119/)
Existing items: EXI007, EXI015, EXI016

### EX07 — World aliveness / intentional character
**Decision:** remain_research_only
World-aliveness is a validated primal family, but these custom items mix felt intentionality and metaphysical responsiveness; retain as research-only.
Academic basis: [Primal World Beliefs](https://pubmed.ncbi.nlm.nih.gov/30299119/)
Existing items: EXI019, EXI020, EXI021

### EX08 — Optimism vs resignation
**Decision:** remain_research_only
The current scale mixes social improvability, personal problems, and pessimism; it is not a clean optimism measure.
Academic basis: [Primal World Beliefs](https://pubmed.ncbi.nlm.nih.gov/30299119/)
Existing items: EXI022, EXI023, EXI024

### EX09 — Response to meaninglessness
**Decision:** remain_derived
Responses to meaninglessness should be derived from meaning/nihilism responses rather than scored as an independent latent trait.
Academic basis: [The Meaning of Life](https://plato.stanford.edu/entries/life-meaning/)
Existing items: none

### SO03 — Relational / interdependent self
**Decision:** ready_existing_items
Existing items directly ask whether relationships/roles partly constitute identity; do not equate this with collectivism.
Academic basis: [Singelis (1994): The Measurement of Independent and Interdependent Self-Construals](https://doi.org/10.1177/0146167294205014)
Existing items: SOI003, SOI016, SOI027
Accepted rules: audit-SO03-relational-self

### SO04 — Tolerance of otherness
**Decision:** ready_existing_items
Interpret narrowly as toleration/noninterference toward disliked non-rights-violating ways of life, not generalized warmth toward outgroups.
Academic basis: [Toleration](https://plato.stanford.edu/entries/toleration/)
Existing items: SOI006, SOI017, SOI028
Accepted rules: audit-SO04-toleration

### SO05 — Group-dominance preference
**Decision:** ready_existing_items
Current items align conceptually with group-dominance preference; custom wording is not an SDO-7 administration.
Academic basis: [Social Dominance Orientation 7](https://pubmed.ncbi.nlm.nih.gov/26479362/)
Existing items: SOI009, SOI018, SOI031
Accepted rules: audit-SO05-dominance

### SO06 — Anti-egalitarianism
**Decision:** ready_existing_items
Current items align with opposition to group equality as a distinct SDO-related tendency; do not infer explicit dominance.
Academic basis: [Social Dominance Orientation 7](https://pubmed.ncbi.nlm.nih.gov/26479362/)
Existing items: SOI010, SOI019, SOI032
Accepted rules: audit-SO06-anti-egalitarian

### SO07 — Cooperation orientation
**Decision:** remain_research_only
General cooperation preference is not equivalent to validated Social Value Orientation allocation behavior; retain for research.
Academic basis: [Murphy, Ackermann & Handgraaf (2011): Measuring Social Value Orientation](https://doi.org/10.2139/ssrn.1804189)
Existing items: SOI011, SOI020, SOI033

### SO08 — Competition orientation
**Decision:** remain_research_only
General competition preference is not equivalent to SVO or a single economic ideology; retain for research.
Academic basis: [Murphy, Ackermann & Handgraaf (2011): Measuring Social Value Orientation](https://doi.org/10.2139/ssrn.1804189)
Existing items: SOI012, SOI021, SOI034

### SO09 — Scope of moral concern / cosmopolitan concern
**Decision:** ready_existing_items
Current items directly address moral scope across group boundaries; distinguish from institutional cosmopolitanism and absence of special obligations.
Academic basis: [Cosmopolitanism](https://plato.stanford.edu/entries/cosmopolitanism/)
Existing items: SOI004, SOI005, SOI029
Accepted rules: audit-SO09-moral-scope

### SO10 — Social-category essentialism
**Decision:** ready_existing_items
Current items support a narrow psychological-essentialism interpretation; do not infer biological determinism or stereotype endorsement.
Academic basis: [Bastian & Haslam (2006): Psychological Essentialism and Stereotype Endorsement](https://doi.org/10.1016/j.jesp.2005.03.003)
Existing items: SOI008, SOI022, SOI035
Accepted rules: audit-SO10-essentialism

### SO12 — Humanity-nature worldview
**Decision:** split_or_deprecate
Humanity-nature worldview is hierarchical. Existing items support ecological interdependence and anthropocentric-priority subclaims, not one total ecological score.
Academic basis: [Dunlap et al. (2000): Revised New Ecological Paradigm Scale](https://doi.org/10.1111/0022-4537.00176)
Existing items: SOI007, SOI024, SOI030, SOI040
Accepted rules: audit-SO12-anthropocentric-priority, audit-SO12-interdependence

### SO13 — Belief in social/world justice
**Decision:** ready_existing_items
Current items directly address general just-world belief; do not infer personal just-world belief or victim blaming.
Academic basis: [General and Personal Belief in a Just World scales](https://paedagogik.uni-halle.de/arbeitsbereich/psycho-erz/dalbert/download_instrumente/?lang=en)
Existing items: SOI037, SOI038, SOI039
Accepted rules: audit-SO13-just-world

### PL01 — Legitimacy of coercive political authority
**Decision:** ready_existing_items
Current items directly ask whether political institutions can possess a moral right to coerce; keep distinct from political obligation.
Academic basis: [Fabienne Peter: Political Legitimacy](https://plato.stanford.edu/entries/legitimacy/)
Existing items: PLI001, PLI024, PLI047
Accepted rules: audit-PL01-legitimacy

### PL05 — Centralization vs decentralization
**Decision:** ready_existing_items
Interpret as centralization/decentralization preference in stated governance contexts, not as a complete theory of federalism.
Academic basis: [Federalism](https://plato.stanford.edu/entries/federalism/)
Existing items: PLI003, PLI004, PLI050
Accepted rules: audit-PL05-decentralization

### PL10 — Distributive-principle family
**Decision:** split_or_deprecate
Equality, need, desert, sufficiency, priority, and entitlement are different distributive principles. Ranking them does not justify one family score.
Academic basis: [Distributive Justice](https://plato.stanford.edu/entries/justice-distributive/)
Existing items: PLI012, PLI032, PLI053

### PL12 — Collective / common ownership legitimacy
**Decision:** ready_existing_items
Current items directly address legitimacy of common ownership; do not infer socialism or rejection of private property in all domains.
Academic basis: [Property and Ownership](https://plato.stanford.edu/entries/property/)
Existing items: PLI014, PLI034, PLI059
Accepted rules: audit-PL12-common-ownership

### PL14 — Collective / democratic coordination preference
**Decision:** ready_existing_items
Interpret as preference for participatory/democratic coordination in stated contexts, not as endorsement of political democracy everywhere.
Academic basis: [Elinor Ostrom (2010): Beyond Markets and States: Polycentric Governance of Complex Economic Systems](https://doi.org/10.1257/aer.100.3.641)
Existing items: PLI005, PLI036, PLI060
Accepted rules: audit-PL14-democratic-coordination

### PL15 — Expert / administrative coordination preference
**Decision:** ready_existing_items
Interpret as preference for expert/administrative decision authority in stated contexts, distinct from valuing expert testimony.
Academic basis: [The Ethics and Rationality of Voting](https://plato.stanford.edu/entries/voting/)
Existing items: PLI005, PLI037, PLI061
Accepted rules: audit-PL15-expert-coordination

### PL19 — Deterrent punishment
**Decision:** ready_existing_items
Current items directly address deterrence as a purpose/justification of punishment; mixed theories remain possible.
Academic basis: [Legal Punishment](https://plato.stanford.edu/entries/legal-punishment/)
Existing items: PLI018, PLI041, PLI065
Accepted rules: audit-PL19-deterrence

### PL20 — Rehabilitative / restorative punishment
**Decision:** split_or_deprecate
Rehabilitation and restorative repair are distinct aims. Current direct items bundle them, so do not emit one combined score.
Academic basis: [Legal Punishment](https://plato.stanford.edu/entries/legal-punishment/)
Existing items: PLI019, PLI042, PLI066

### PL25 — Reform vs rupture orientation
**Decision:** ready_existing_items
Interpret as gradual reform versus decisive institutional replacement; do not equate rupture with violent revolution.
Academic basis: [Revolution](https://plato.stanford.edu/entries/revolution/)
Existing items: PLI075, PLI076, PLI077
Accepted rules: audit-PL25-reform

## Representation after this audit

- **AH**: 5/9 audited gaps now mapped; 4 intentionally unresolved.
- **EP**: 5/6 audited gaps now mapped; 1 intentionally unresolved.
- **EX**: 2/6 audited gaps now mapped; 4 intentionally unresolved.
- **ME**: 0/1 audited gaps now mapped; 1 intentionally unresolved.
- **MF**: 0/1 audited gaps now mapped; 1 intentionally unresolved.
- **MS**: 0/1 audited gaps now mapped; 1 intentionally unresolved.
- **OM**: 1/1 audited gaps now mapped; 0 intentionally unresolved.
- **PL**: 7/9 audited gaps now mapped; 2 intentionally unresolved.
- **RC**: 4/5 audited gaps now mapped; 1 intentionally unresolved.
- **SO**: 8/10 audited gaps now mapped; 2 intentionally unresolved.

Strongly represented means only that the current theory-informed model has multiple scoped rules and item bundles; it does not mean psychometric validation. Weakness is preserved wherever discrimination, construct scope, or item quality is inadequate.

## Additional original questions justified, but not added to the bank

### EP03
Need a second independent negative indicator that distinguishes skepticism about knowability from approximation and domain-limited uncertainty.
- There are at least some factual questions for which sufficiently good inquiry can yield knowledge that the answer is objectively correct.
- Human inquiry may approach better explanations, but it can never know any factual answer to be objectively correct.

### AH01
Need direct free-will existence items that do not presuppose compatibilism or incompatibilism.
- Human beings possess at least some genuine control over action that deserves to be called free will, whatever the correct theory of that control is.
- Human behavior never involves the kind of control that would count as genuine free will.

### AH05
The existing construct bundles self-interest and competition; AH13 already measures psychological egoism and SO08 covers competition.
- Even when cooperation is available, people usually pursue their own advantage as a default motive.
- Competition is a common default pattern of interaction even when nobody is forced into it.

### PL10
The six distributive principles need direct, non-ranking indicators so a single top-choice task does not define an affinity.
- When no stronger claim applies, making people's shares more equal is itself a reason in favor of a distribution.
- Greater need is itself a reason to give someone a larger share.
- Greater contribution or desert is itself a reason to give someone a larger share.
- Ensuring that everyone has enough can matter more than reducing inequality above that threshold.
- Benefits to people who are worse off can deserve extra weight even when total gains are smaller.
- A person's legitimate prior entitlement can justify an unequal share even when another distribution would be more equal.

### PL20
Rehabilitation and restorative repair are distinct purposes and need separate direct indicators.
- Changing an offender's capacities and dispositions so future wrongdoing is less likely is itself an important aim of a just response.
- Repairing harm among victims, offenders, and affected communities is itself an important aim of justice after wrongdoing.

## Methodological boundary

References to validated psychological instruments identify neighboring constructs and measurement distinctions. They do not validate our rewritten/original items, justify importing published norms, or authorize copying copyrighted items.
Derived families remain derived. Research-only constructs remain available for later calibration but are not promoted merely because an academic scale with a related name exists.
No political actor, party, or current policy choice is ranked by this audit. Political constructs are framed as reported philosophical commitments.
