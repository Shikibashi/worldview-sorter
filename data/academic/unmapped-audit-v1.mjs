// Audit of the 49 constructs that were unmapped in generic-0.2.0.
// These are theory-informed interpretation decisions, not empirical calibration.
const src=(id,title,url,access,claim)=>({id,title,url,access,evidenceType:"academic_conceptual_or_measurement_reference",reviewedOn:"2026-09-29",claim,validatesOurItems:false,permissionToCopyItems:false});
export const sources=[
 src("audit-schommer","Schommer (1990): Effects of Beliefs About the Nature of Knowledge on Comprehension","https://doi.org/10.1037/0022-0663.82.3.498","abstract_and_bibliographic_record_reviewed","Personal epistemology research separates simple/complex and certain/tentative knowledge beliefs; our custom items are not that questionnaire."),
 src("audit-apriori","A Priori Justification and Knowledge","https://plato.stanford.edu/entries/apriori/","selected_sections_reviewed","A priori justification is justification in some sense independent of experience; it should not be inferred from philosophical knowledge trivia."),
 src("audit-perception","Epistemological Problems of Perception","https://plato.stanford.edu/entries/perception-episprob/","selected_sections_reviewed","External-world skepticism, perceptual knowledge, and metaphysical questions about perception are distinct."),
 src("audit-responsibility","Moral Responsibility","https://plato.stanford.edu/entries/moral-responsibility/","selected_sections_reviewed","Basic desert, control, and compatibility with determinism are separable questions."),
 src("audit-human-nature","Human Nature","https://plato.stanford.edu/entries/human-nature/","selected_sections_reviewed","Claims about human nature vary in content, explanatory role, and normative significance; no single benevolence/selfishness meter captures the field."),
 src("audit-altruism","Altruism","https://plato.stanford.edu/entries/altruism/","selected_sections_reviewed","Psychological egoism and altruistic motivation are descriptive claims distinct from ethical egoism."),
 src("audit-fixed-malleable","Levy, Stroessner & Dweck (1998): Stereotype Formation and Endorsement","https://doi.org/10.1037/0022-3514.74.6.1421","abstract_reviewed","Entity versus incremental theories concern fixed versus malleable human attributes; they do not settle biological versus environmental causation."),
 src("audit-revelation","Divine Revelation","https://plato.stanford.edu/entries/divine-revelation/","selected_sections_reviewed","Revelation is an epistemic notion with competing inferential, testimonial, and noninferential accounts of justification."),
 src("audit-divine-intervention","Degelman & Lynn (1995): Belief in Divine Intervention Scale","https://doi.org/10.1177/009164719502300104","abstract_reviewed","A dedicated scale has measured belief in divine intervention, but its validation and item wording do not transfer to our original questions."),
 src("audit-miracles","Miracles","https://plato.stanford.edu/entries/miracles/","selected_sections_reviewed","Miracle claims require conceptual separation from mere scientific unexplainedness and from generic belief in divine intervention."),
 src("audit-providence","Divine Providence","https://plato.stanford.edu/entries/providence-divine/","selected_sections_reviewed","Traditional theism includes divine agency and governance, but personal deity, providence, and miracle beliefs remain separable."),
 src("audit-selfconstrual","Singelis (1994): The Measurement of Independent and Interdependent Self-Construals","https://doi.org/10.1177/0146167294205014","abstract_reviewed","Independent and interdependent self-construals can coexist; our relational-self items are not a validated administration of the Self-Construal Scale."),
 src("audit-toleration","Toleration","https://plato.stanford.edu/entries/toleration/","selected_sections_reviewed","Toleration concerns conditional acceptance/noninterference with disapproved beliefs or practices and has multiple conceptions."),
 src("audit-essentialism","Bastian & Haslam (2006): Psychological Essentialism and Stereotype Endorsement","https://doi.org/10.1016/j.jesp.2005.03.003","abstract_reviewed","Psychological essentialism includes biological basis, discreteness, and informativeness; our items only cover a subset."),
 src("audit-justworld","General and Personal Belief in a Just World scales","https://paedagogik.uni-halle.de/arbeitsbereich/psycho-erz/dalbert/download_instrumente/?lang=en","instrument_description_reviewed","General belief in a just world concerns whether people broadly get what they deserve; it is distinct from personal just-world belief."),
 src("audit-nep","Dunlap et al. (2000): Revised New Ecological Paradigm Scale","https://doi.org/10.1111/0022-4537.00176","abstract_reviewed","The revised NEP measures multiple facets of ecological worldview; our custom humanity-nature items are not the NEP scale."),
 src("audit-svo","Murphy, Ackermann & Handgraaf (2011): Measuring Social Value Orientation","https://doi.org/10.2139/ssrn.1804189","abstract_reviewed","SVO measures social preferences in interdependent allocation choices; generic cooperation/competition beliefs are not equivalent to SVO."),
 src("audit-federalism","Federalism","https://plato.stanford.edu/entries/federalism/","selected_sections_reviewed","Federalism divides authority between levels, while decentralization is broader; preference for local variation is not automatically federalism."),
 src("audit-epistocracy","The Ethics and Rationality of Voting","https://plato.stanford.edu/entries/voting/","selected_sections_reviewed","Epistocracy allocates political power partly by knowledge/competence; expert advice and expert rule are distinct."),
 src("audit-revolution","Revolution","https://plato.stanford.edu/entries/revolution/","selected_sections_reviewed","Revolution, resistance, rebellion, secession, and reform are distinct; a preference for institutional rupture is not automatically endorsement of violent revolution.")
];

const a=(itemId,polarity=1)=>({itemId,support:polarity===1?[1,2]:[-2,-1],oppose:polarity===1?[-2,-1]:[1,2]});
const e=(itemId,support,oppose=[])=>({itemId,support,oppose});
const R=(id,constructId,label,sourceIds,evidence,boundary,scope=label)=>({id,constructId,label,sourceIds,evidence,boundary,scope,layer:"audit_scoped_commitment"});

export const decisions=[
 ["ME07","remain_derived","Metaethical family should remain a derived synthesis over independently measured metaethical commitments; MEI005 is diagnostic, not a standalone family scale."],
 ["MF07","remain_research_only","Liberty/opposition-to-domination is theoretically interesting, but it is not part of the standard MFQ-2 six-foundation model and the current items are original exploratory content."],
 ["EP02","ready_existing_items","Existing items directly ask whether knowledge is simple versus interconnected/developing; interpret only this narrow personal-epistemology proposition."],
 ["EP03","needs_new_discriminating_items","EPI015 was already excluded and the remaining material does not provide two independent negative indicators of truth attainability without conflating approximation, skepticism, and conventionalism."],
 ["EP05","ready_existing_items","Two direct, opposing items support a narrow a-priori-justification interpretation; EPI025 remains excluded as a knowledge/trivia recognition question."],
 ["EP06","ready_existing_items","Public systematic testability can be interpreted as an epistemic preference, without claiming science is the only source of knowledge."],
 ["EP10","ready_existing_items","Current items directly ask whether purported revelation can provide factual justification; this is distinct from revelation's moral or political authority."],
 ["EP11","split_or_deprecate","The current construct conflates external-world metaphysics, perceptual directness, and skepticism. Retain narrower external-world-independence and skepticism interpretations; do not emit one categorical label."],
 ["OM08","split_or_deprecate","Substantive-versus-deflationary attitudes can be reported, but framework relativity and verbalism should not be collapsed into one categorical metaontology label."],
 ["MS07","remain_derived","Identity-under-transformation is appropriately a derived pattern over continuity and transformation cases; one teleportation item cannot support a direct scale."],
 ["AH01","needs_new_discriminating_items","Current free-will items partly encode compatibilist conditions, so disagreement may mean incompatibilism rather than disbelief in free will."],
 ["AH03","ready_existing_items","Current items directly address basic/desert-entailing responsibility and manipulation; keep distinct from forward-looking responsibility."],
 ["AH04","split_or_deprecate","The broad 'baseline benevolence' label overreaches. Existing direct items can support only the narrower claim that humans are capable of genuinely other-regarding motivation."],
 ["AH05","split_or_deprecate","Self-interest prevalence and competition are different. Psychological egoism is already represented by AH13 and social competition by SO08; do not score this bundled construct as one worldview dimension."],
 ["AH06","ready_existing_items","Existing items directly concern malleability of human dispositions; keep separate from whether causes are biological or environmental."],
 ["AH07","remain_research_only","A generic preference for multi-causal explanation is a methodological outlook with no clear validated worldview construct here; retain for research only."],
 ["AH08","ready_existing_items","Interpret only the reported belief that biological/inherited factors can make substantial causal contributions; do not infer immutability or normativity."],
 ["AH09","ready_existing_items","Interpret only the reported belief that social/environmental factors can substantially shape behavior; do not infer blank-slate views."],
 ["AH12","remain_derived","Compatibilist/libertarian/skeptical family classification must remain derived from free-will, determinism, and responsibility answers."],
 ["RC02","ready_existing_items","Conditional questions directly distinguish personal/agentic from impersonal divinity; only interpret when relevant branch prerequisites are satisfied."],
 ["RC04","ready_existing_items","Current items directly address whether supernatural agency can intervene in ordinary events."],
 ["RC05","ready_existing_items","Current items directly address miracles, while distinguishing unexplained natural events from miracle claims."],
 ["RC06","ready_existing_items","Current items support a narrow claim about purported revelation having authority for belief or conduct, distinct from public-law authority."],
 ["RC11","remain_derived","Theism, deism, pantheism, panentheism, and impersonal divinity are a family of alternatives. Keep the family descriptive/derived rather than a single score."],
 ["EX02","split_or_deprecate","Designer-grounded and non-designer sources of objective purpose should be separate commitments, not one categorical score."],
 ["EX04","ready_existing_items","Current items directly distinguish denial of objective/inherent meaning from alternative objective or constructed sources."],
 ["EX05","remain_research_only","World-safety is a validated Primal World Beliefs construct, but these are custom items and should remain explicitly exploratory until calibrated."],
 ["EX07","remain_research_only","World-aliveness is a validated primal family, but these custom items mix felt intentionality and metaphysical responsiveness; retain as research-only."],
 ["EX08","remain_research_only","The current scale mixes social improvability, personal problems, and pessimism; it is not a clean optimism measure."],
 ["EX09","remain_derived","Responses to meaninglessness should be derived from meaning/nihilism responses rather than scored as an independent latent trait."],
 ["SO03","ready_existing_items","Existing items directly ask whether relationships/roles partly constitute identity; do not equate this with collectivism."],
 ["SO04","ready_existing_items","Interpret narrowly as toleration/noninterference toward disliked non-rights-violating ways of life, not generalized warmth toward outgroups."],
 ["SO05","ready_existing_items","Current items align conceptually with group-dominance preference; custom wording is not an SDO-7 administration."],
 ["SO06","ready_existing_items","Current items align with opposition to group equality as a distinct SDO-related tendency; do not infer explicit dominance."],
 ["SO07","remain_research_only","General cooperation preference is not equivalent to validated Social Value Orientation allocation behavior; retain for research."],
 ["SO08","remain_research_only","General competition preference is not equivalent to SVO or a single economic ideology; retain for research."],
 ["SO09","ready_existing_items","Current items directly address moral scope across group boundaries; distinguish from institutional cosmopolitanism and absence of special obligations."],
 ["SO10","ready_existing_items","Current items support a narrow psychological-essentialism interpretation; do not infer biological determinism or stereotype endorsement."],
 ["SO12","split_or_deprecate","Humanity-nature worldview is hierarchical. Existing items support ecological interdependence and anthropocentric-priority subclaims, not one total ecological score."],
 ["SO13","ready_existing_items","Current items directly address general just-world belief; do not infer personal just-world belief or victim blaming."],
 ["PL01","ready_existing_items","Current items directly ask whether political institutions can possess a moral right to coerce; keep distinct from political obligation."],
 ["PL05","ready_existing_items","Interpret as centralization/decentralization preference in stated governance contexts, not as a complete theory of federalism."],
 ["PL10","split_or_deprecate","Equality, need, desert, sufficiency, priority, and entitlement are different distributive principles. Ranking them does not justify one family score."],
 ["PL12","ready_existing_items","Current items directly address legitimacy of common ownership; do not infer socialism or rejection of private property in all domains."],
 ["PL14","ready_existing_items","Interpret as preference for participatory/democratic coordination in stated contexts, not as endorsement of political democracy everywhere."],
 ["PL15","ready_existing_items","Interpret as preference for expert/administrative decision authority in stated contexts, distinct from valuing expert testimony."],
 ["PL19","ready_existing_items","Current items directly address deterrence as a purpose/justification of punishment; mixed theories remain possible."],
 ["PL20","split_or_deprecate","Rehabilitation and restorative repair are distinct aims. Current direct items bundle them, so do not emit one combined score."],
 ["PL25","ready_existing_items","Interpret as gradual reform versus decisive institutional replacement; do not equate rupture with violent revolution."]
].map(([constructId,decision,rationale])=>({constructId,decision,rationale}));

export const rules=[
 R("audit-EP02-complex-knowledge","EP02","Knowledge is often complex and interconnected",["audit-schommer"],[
  a("EPI009"),a("EPI014",-1),e("EPI028",["complex_dynamic"],["simple_facts"])
 ],"This is a personal-epistemology belief about knowledge structure, not a measure of intelligence or sophistication."),
 R("audit-EP05-apriori","EP05","Some justification can be independent of new observation",["audit-apriori"],[
  a("EPI006"),a("EPI017",-1)
 ],"This concerns a priori justification in a broad sense; it does not imply rationalism about all substantive knowledge."),
 R("audit-EP06-testability","EP06","Public systematic testing deserves substantial epistemic weight",["domain-science-objectivity"],[
  a("EPI004"),e("EPI026",[-2,-1],[1,2])
 ],"Preferring publicly testable methods does not entail that every justified belief must be scientifically testable."),
 R("audit-EP10-revelation","EP10","Purported revelation can provide factual justification",["audit-revelation"],[
  a("EPI012"),a("EPI021",-1),e("EPI032",["substantial","some"],["little","none"])
 ],"Epistemic warrant from revelation is separate from religious identity, moral authority, and political authority."),
 R("audit-EP11-external-world","EP11","Ordinary objects are mind-independent",["audit-perception"],[
  a("EPI036"),e("EPI034",["direct","indirect"],["idealist"]),e("EPI037",["mind_independent"],["mind_dependent"])
 ],"Mind-independence is distinct from whether perception is direct or representational and from whether perceptual knowledge is certain."),
 R("audit-EP11-skepticism","EP11","External-world skepticism",["audit-perception"],[
  e("EPI034",["skeptical"],["direct","indirect"]),e("EPI035",["skepticism"],["knowledge_remains"]),e("EPI037",["suspend"],["mind_independent"])
 ],"Suspending judgment and endorsing a skeptical argument are not identical; this is a narrow skepticism-related pattern."),
 R("audit-OM08-substantive","OM08","Many ontological disputes are substantive",["acad-thomasson","acad-marschall"],[
  a("OMI022"),a("OMI023",-1),e("OMI024",["substantive"],["deflationary"])
 ],"Substantive ontology does not commit the respondent to any particular inventory of entities."),
 R("audit-OM08-deflationary","OM08","Many ontological disputes are verbal, framework-relative, or deflationary",["acad-thomasson","acad-marschall"],[
  a("OMI023"),a("OMI022",-1),e("OMI024",["deflationary"],["substantive"])
 ],"Framework dependence and full verbal deflationism remain distinct; this rule reports only a broad deflationary tendency."),
 R("audit-AH03-basic-desert","AH03","Basic desert-based moral responsibility is possible",["audit-responsibility"],[
  a("AHI003"),a("AHI014",-1),e("AHI025",["full","reduced"],["none_basic"])
 ],"Basic desert is distinct from forward-looking responsibility, blame practices, deterrence, and rehabilitation."),
 R("audit-AH04-altruistic-capacity","AH04","Humans can be motivated by genuine concern for others",["audit-altruism"],[
  a("AHI006"),a("AHI015")
 ],"This is the narrower claim that altruistic motivation exists in the human repertoire; it is not a claim that humans are generally benevolent."),
 R("audit-AH06-malleability","AH06","Important human dispositions are substantially malleable",["audit-fixed-malleable","audit-human-nature"],[
  a("AHI004"),a("AHI008",-1),e("AHI028",["strongly","somewhat"],["little"])
 ],"Malleability does not imply that biology is irrelevant or that all traits are equally changeable."),
 R("audit-AH08-biological","AH08","Biological factors can substantially contribute to behavioral differences",["audit-human-nature"],[
  a("AHI010"),a("AHI018",-1),e("AHI030",["strong","some"],["little","none"])
 ],"This is a causal-attribution belief, not a normative claim, genetic determinism, or a claim that environments are unimportant."),
 R("audit-AH09-environmental","AH09","Social and environmental conditions can substantially shape behavior",["audit-human-nature"],[
  a("AHI019"),a("AHI022"),e("AHI031",["strong","some"],["little","none"])
 ],"Environmental influence can coexist with biological influence and does not entail a blank-slate theory."),
 R("audit-RC02-agentic-divinity","RC02","If divine reality exists, it is personal or agentic",["audit-providence","gen-theology"],[
  a("RCI002"),a("RCI015",-1),e("RCI025",["personal","partly_personal"],["impersonal"])
 ],"This is conditional on divine reality and does not itself establish providence, intervention, or a particular religion."),
 R("audit-RC04-intervention","RC04","Supernatural agency can intervene in ordinary events",["audit-divine-intervention","audit-providence"],[
  a("RCI009"),a("RCI016",-1),e("RCI026",["intervention_plausible","possible_but_weak"],["natural_only"])
 ],"Belief that intervention is possible is weaker than attributing a particular event to intervention."),
 R("audit-RC05-miracles","RC05","Genuinely miraculous events can occur",["audit-miracles"],[
  a("RCI010"),a("RCI017",-1),e("RCI027",["miracle_live"],["natural_only"])
 ],"An unexplained event is not automatically a miracle; agnosticism and preference for unknown natural explanation remain non-directional."),
 R("audit-RC06-revelatory-authority","RC06","Genuine revelation can carry authority for belief or conduct",["audit-revelation"],[
  a("RCI011"),e("RCI028",[-2,-1],[1,2])
 ],"Private revelatory authority is separate from whether revelation is epistemically justified and from whether it should ground coercive law."),
 R("audit-EX02-nondesigner-purpose","EX02","Objective purpose could have a non-designer source",["gen-meaning"],[
  a("EXI013"),a("EXI014",-1),e("EXI012",["nature","objective_values"],["none"])
 ],"This does not establish that objective purpose actually exists; it concerns a proposed source conditional on that possibility."),
 R("audit-EX02-designer-purpose","EX02","Objective purpose requires a purposive mind or designer",["gen-meaning"],[
  a("EXI014"),e("EXI012",["divine"],["nature","objective_values","none"])
 ],"Designer-grounded purpose is distinct from belief in a specific deity or from subjective meaning."),
 R("audit-EX04-nihilism","EX04","Human life lacks objective or inherent meaning",["gen-meaning"],[
  a("EXI003"),a("EXI006",-1),e("EXI011",["nihilism"],["objective_other"])
 ],"Existential nihilism about objective meaning does not imply depression, lack of constructed meaning, or pessimism."),
 R("audit-SO03-relational-self","SO03","Relationships and social roles partly constitute personal identity",["audit-selfconstrual"],[
  a("SOI003"),a("SOI016",-1),e("SOI027",["greatly","somewhat"],["little"])
 ],"Relational self-construal can coexist with individual autonomy and is not equivalent to political collectivism."),
 R("audit-SO04-toleration","SO04","Disliked non-rights-violating ways of life should normally be tolerated or protected",["audit-toleration"],[
  a("SOI006"),a("SOI017",-1),e("SOI028",["protect","tolerate"],["discourage","restrict"])
 ],"Toleration is not approval, warmth, multicultural policy, or agreement with the tolerated practice."),
 R("audit-SO05-dominance","SO05","Group-based dominance is acceptable",["sdo7"],[
  a("SOI009"),a("SOI018",-1),e("SOI031",["hierarchy_ok"],["oppose_hierarchy"])
 ],"These custom items are not the SDO-7 and do not justify applying its published norms or cutoffs."),
 R("audit-SO06-anti-egalitarian","SO06","Reducing group-status inequality is not intrinsically important",["sdo7"],[
  a("SOI010"),a("SOI019",-1),e("SOI032",["not_itself","oppose"],["important"])
 ],"Anti-egalitarianism is distinct from an explicit desire for one group to dominate another."),
 R("audit-SO09-moral-scope","SO09","Moral concern extends across group and national boundaries",["domain-cosmopolitanism"],[
  a("SOI004"),e("SOI005",[1,2],[-2,-1]),e("SOI029",[1,2],[-2,-1])
 ],"Broad moral concern can coexist with some special obligations to compatriots or close associates."),
 R("audit-SO10-essentialism","SO10","Social categories reflect deep, stable essences",["audit-essentialism"],[
  a("SOI008"),a("SOI022",-1),e("SOI035",["still_essence"],["mostly_constructed","nominal"])
 ],"This captures only a subset of psychological essentialism and does not by itself imply stereotype endorsement or biological determinism."),
 R("audit-SO12-interdependence","SO12","Humans are participants within ecological systems rather than masters outside them",["audit-nep"],[
  a("SOI007"),a("SOI040")
 ],"These custom items are not the NEP scale and do not establish every ecological worldview facet."),
 R("audit-SO12-anthropocentric-priority","SO12","Human welfare should normally take priority over nonhuman ecological preservation",["audit-nep"],[
  a("SOI024"),e("SOI030",[-2,-1],[1,2])
 ],"This is a tradeoff preference in stated cases, not a complete theory of environmental value."),
 R("audit-SO13-just-world","SO13","People generally get outcomes they deserve",["audit-justworld"],[
  a("SOI037"),a("SOI038",-1)
 ],"General just-world belief is distinct from personal just-world belief and does not by itself establish victim blaming."),
 R("audit-PL01-legitimacy","PL01","Political institutions can sometimes possess a moral right to coerce",["acad-legitimacy"],[
  a("PLI001"),a("PLI024",-1),e("PLI047",["yes","qualified"],["no"])
 ],"Legitimacy and a general duty to obey are distinct; no candidate, party, or current regime is evaluated."),
 R("audit-PL05-decentralization","PL05","Political authority should generally be more decentralized rather than centralized",["audit-federalism"],[
  a("PLI004"),a("PLI003",-1),e("PLI050",[1,2],[-2,-1])
 ],"Decentralization is broader than federalism and can be favored for different reasons; this is not a constitutional prescription."),
 R("audit-PL12-common-ownership","PL12","Common ownership can be a legitimate property arrangement",["domain-property"],[
  a("PLI014"),a("PLI034",-1),e("PLI059",[1,2],[-2,-1])
 ],"Legitimacy of some common property does not imply socialism or rejection of private property across all resources."),
 R("audit-PL14-democratic-coordination","PL14","Participatory or democratic coordination should carry substantial decision weight",["acad-ostrom"],[
  a("PLI036",-1),e("PLI060",[-2,-1],[1,2])
 ],"This concerns coordination in stated activities and workplaces, not a general claim that every institution should use majority rule."),
 R("audit-PL15-expert-coordination","PL15","Expert or administrative judgment should carry substantial decision authority",["audit-epistocracy"],[
  a("PLI037",-1),e("PLI061",[-2,-1],[1,2])
 ],"Valuing expertise as evidence is distinct from granting experts political decision authority."),
 R("audit-PL19-deterrence","PL19","Deterrence can substantially justify punishment",["domain-punishment"],[
  a("PLI018"),a("PLI041",-1),e("PLI065",["yes","sometimes"],["no"])
 ],"Deterrence can coexist with retributive, communicative, rehabilitative, or restorative reasons; no criminal-justice policy is ranked."),
 R("audit-PL25-reform","PL25","Gradual reform should normally be preferred to decisive institutional replacement",["audit-revolution"],[
  a("PLI075"),a("PLI077",-1),e("PLI076",[-2,-1],[1,2])
 ],"Institutional rupture is not automatically violent revolution, rebellion, resistance, or secession.")
];

export const questionProposals=[
 {constructId:"EP03",reason:"Need a second independent negative indicator that distinguishes skepticism about knowability from approximation and domain-limited uncertainty.",items:[
  "There are at least some factual questions for which sufficiently good inquiry can yield knowledge that the answer is objectively correct.",
  "Human inquiry may approach better explanations, but it can never know any factual answer to be objectively correct."
 ]},
 {constructId:"AH01",reason:"Need direct free-will existence items that do not presuppose compatibilism or incompatibilism.",items:[
  "Human beings possess at least some genuine control over action that deserves to be called free will, whatever the correct theory of that control is.",
  "Human behavior never involves the kind of control that would count as genuine free will."
 ]},
 {constructId:"AH05",reason:"The existing construct bundles self-interest and competition; AH13 already measures psychological egoism and SO08 covers competition.",items:[
  "Even when cooperation is available, people usually pursue their own advantage as a default motive.",
  "Competition is a common default pattern of interaction even when nobody is forced into it."
 ]},
 {constructId:"PL10",reason:"The six distributive principles need direct, non-ranking indicators so a single top-choice task does not define an affinity.",items:[
  "When no stronger claim applies, making people's shares more equal is itself a reason in favor of a distribution.",
  "Greater need is itself a reason to give someone a larger share.",
  "Greater contribution or desert is itself a reason to give someone a larger share.",
  "Ensuring that everyone has enough can matter more than reducing inequality above that threshold.",
  "Benefits to people who are worse off can deserve extra weight even when total gains are smaller.",
  "A person's legitimate prior entitlement can justify an unequal share even when another distribution would be more equal."
 ]},
 {constructId:"PL20",reason:"Rehabilitation and restorative repair are distinct purposes and need separate direct indicators.",items:[
  "Changing an offender's capacities and dispositions so future wrongdoing is less likely is itself an important aim of a just response.",
  "Repairing harm among victims, offenders, and affected communities is itself an important aim of justice after wrongdoing."
 ]}
];

export const expectedCounts={
 total:49,
 ready_existing_items:27,
 needs_new_discriminating_items:2,
 remain_derived:5,
 remain_research_only:7,
 split_or_deprecate:8
};
