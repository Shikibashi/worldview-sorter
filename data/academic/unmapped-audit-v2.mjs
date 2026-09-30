// Review of the 49 gaps in coverage-v0.2. These are editorial dispositions,
// not estimated factors, calibrated thresholds, or claims of respondent validity.
export const dispositions = Object.fromEntries([
 ['ME07','derived_only','A metaethical family combines independently interpreted answers; one diagnostic case cannot identify a family.'],
 ['MF07','research_only','The original domination items are not an administration of MFQ-2 or a calibrated foundation.'],
 ['EP02','directly_interpretable','The knowledge-structure items address complexity directly; use only that narrow proposition.'],
 ['EP03','requires_new_discriminating_items','The existing answer set confounds knowledge with certainty and domain-limited skepticism.'],
 ['EP05','unresolved','New observation, all empirical support, and substantive knowledge differ; the existing pair is not converse evidence.'],
 ['EP06','directly_interpretable','Public repeatable testing is directly compared with private unchecked methods.'],
 ['EP10','directly_interpretable','The items address factual warrant from sincere revelation without independent verification.'],
 ['EP11','split','Mind-independence can be interpreted; direct perception and external-world skepticism remain separate gaps.'],
 ['OM08','split','Substantive, framework-relative, and merely verbal disputes are different; the existing frequency claims do not align.'],
 ['MS07','derived_only','Transformation cases can inform a synthesis, but one teleportation scenario does not define a scale.'],
 ['AH01','requires_new_discriminating_items','Compatibilist conditions cannot be used as denials of free will by incompatibilists.'],
 ['AH03','unresolved','A manipulated action and causal explanation do not negate the possibility of desert in other actions.'],
 ['AH04','split','Capacity for altruism and frequency of benevolent action differ; disagreeing with often does not deny capacity.'],
 ['AH05','split','Self-interest, psychological egoism, and competition are distinct claims; the current items bundle them.'],
 ['AH06','unresolved','Change in some dispositions can coexist with stability in others; the apparent opposites have different quantifiers.'],
 ['AH07','research_only','Multicausal explanation is an exploratory methodological variable, not an interpreted human-nature factor.'],
 ['AH08','directly_interpretable','Direct items address substantial biological contribution; one twin vignette is excluded as general negative evidence.'],
 ['AH09','directly_interpretable','Direct items address substantial environmental influence; one group vignette is excluded as general negative evidence.'],
 ['AH12','derived_only','Freedom-theory families require joint free-will, determinism, and responsibility evidence.'],
 ['RC02','directly_interpretable','The conditional items directly contrast agentic and impersonal divinity.'],
 ['RC04','directly_interpretable','Two general possibility items address intervention; a single prayer case does not refute possibility.'],
 ['RC05','directly_interpretable','Two general possibility items address miraculous events; an unexplained recovery is not a general test.'],
 ['RC06','unresolved','Overriding a purported revelation in one moral conflict does not deny all private revelatory authority.'],
 ['RC11','derived_only','Theism, deism, pantheism, and impersonal divinity are descriptive alternatives, not one direct scale.'],
 ['EX02','split','The non-designer possibility can be interpreted; choosing a divine source as most plausible does not make it necessary.'],
 ['EX04','unresolved','A hypothetical without cosmic purpose cannot establish actual-world nihilism; nondivine objective meaning is another live view.'],
 ['EX05','research_only','World safety is an exploratory primal belief here; custom items are not a validated scale.'],
 ['EX07','research_only','Perceived world responsiveness is exploratory and not evidence of a philosophical identity.'],
 ['EX08','research_only','World-improvability items remain exploratory and uncalibrated.'],
 ['EX09','derived_only','Existential orientation combines separately interpreted propositions.'],
 ['SO03','directly_interpretable','The questions address whether relationships importantly constitute identity, without implying collectivism.'],
 ['SO04','unresolved','Social health under diversity and willingness to accommodate are not the same as toleration.'],
 ['SO05','directly_interpretable','The direct group hierarchy item and matched hierarchy case align; justified-status wording is excluded.'],
 ['SO06','directly_interpretable','The direct group-status item and matched case align; unjustified differences are a separate issue.'],
 ['SO07','research_only','Cooperation preference is not a Social Value Orientation allocation score.'],
 ['SO08','research_only','Competition preference is not a Social Value Orientation allocation score.'],
 ['SO09','directly_interpretable','Interpret equal moral weight in matched local/foreign cases, not the absence of all special duties.'],
 ['SO10','unresolved','Natural regularity in a category does not imply a fixed essence; rare essence is not never essence.'],
 ['SO12','split','Descriptive ecological interdependence and priority in welfare conflicts must not be one score.'],
 ['SO13','directly_interpretable','The general desert/fortune pair addresses a just-world tendency, not personal fortune or victim blame.'],
 ['PL01','unresolved','Rejecting automatic authority or performance alone leaves conditional political legitimacy open.'],
 ['PL05','directly_interpretable','General dispersed-authority preference and a local-versus-uniform case support a narrow preference.'],
 ['PL10','split','Equality, need, desert, sufficiency, priority, and entitlement need distinct propositions; rankings alone do not supply them.'],
 ['PL12','unresolved','A private-property preference does not deny that some commons can be legitimate.'],
 ['PL14','unresolved','Rejecting direction by a collective when exchange works does not endorse democratic authority.'],
 ['PL15','unresolved','Rejecting expertise alone as sufficient authority does not deny expert decision weight.'],
 ['PL19','unresolved','Deterrence as one aim differs from deterrence alone justifying disproportionate punishment.'],
 ['PL20','split','Rehabilitation and restorative repair are different purposes and are bundled in the current direct items.'],
 ['PL25','directly_interpretable','Interpret only preference in deeply defective institutions, not endorsement of violent revolution.']
].map(([id,disposition,reason])=>[id,{constructId:id,disposition,reason}]));

const sep=(id,title,url,claim)=>({id,title,url,access:'selected_sections_reviewed',reviewedOn:'2026-09-29',
 evidenceType:'academic_conceptual_reference',claim,validatesOurItems:false,permissionToCopyItems:false});
export const additionalSources=[
 sep('audit2-freewill-sep','Free Will (Stanford Encyclopedia of Philosophy)','https://plato.stanford.edu/entries/freewill/',
  'The existence, analysis, and moral significance of free will are distinct; causal explanation alone does not decide belief in free will.'),
 sep('audit2-meaning-sep','The Meaning of Life (Stanford Encyclopedia of Philosophy)','https://plato.stanford.edu/entries/life-meaning/',
  'Nihilism about meaning is distinct from rejection of cosmic purpose and from denial of a particular source of objective value.'),
 sep('audit2-legitimacy-sep','Political Legitimacy (Stanford Encyclopedia of Philosophy)','https://plato.stanford.edu/entries/legitimacy/',
  'Normative legitimacy concerns justified political power or authority; conditional authority differs from authority merely by office.'),
 sep('audit2-punishment-sep','Retributive Justice (Stanford Encyclopedia of Philosophy)','https://plato.stanford.edu/entries/justice-retributive/',
  'Deterrence as a reason for punishment and proportionality or desert as limits are separate questions.'),
 sep('audit2-toleration-sep','Toleration (Stanford Encyclopedia of Philosophy)','https://plato.stanford.edu/entries/toleration/',
  'Toleration involves conditional noninterference with disapproved practices; social diversity alone does not identify it.')
];
export const dispositionSourceIds={AH01:['audit2-freewill-sep'],AH03:['audit2-freewill-sep'],EX04:['audit2-meaning-sep'],
 PL01:['audit2-legitimacy-sep'],PL19:['audit2-punishment-sep'],SO04:['audit2-toleration-sep']};

const a=(itemId,support=[1,2],oppose=[-2,-1])=>({itemId,support,oppose});
const e=(itemId,support,oppose=[])=>({itemId,support,oppose});
// Each entry is the full proposition that the answers may support. Omitted
// historical v1 rules are withdrawn from the new model, not altered in v1.
export const retainedRules={
 'audit-EP02-complex-knowledge':{proposition:'Knowledge in complex fields is interconnected and revisable as inquiry develops.',evidence:[a('EPI009'),e('EPI028',['complex_dynamic'],['simple_facts'])],neighbors:['Truth attainability','Skepticism about particular claims'],nonEntailments:['Intelligence','Knowledge of philosophy'],falsePositives:['Disagreeing that most questions are simple may reflect uncertainty rather than interconnected knowledge.']},
 'audit-EP06-testability':{proposition:'Public repeatable testing merits greater confidence than a comparably unsupported private method.',evidence:[a('EPI004'),e('EPI026',[-2,-1],[1,2])],neighbors:['Scientism','Reliance on testimony'],nonEntailments:['Science is the only source of knowledge'],falsePositives:['Confidence in science must not be read as denying every nonscientific justification.']},
 'audit-EP10-revelation':{proposition:'A sincerely believed revelation can itself give some factual justification without independent verification.',evidence:[a('EPI021',[-2,-1],[1,2]),e('EPI032',['substantial'],['none'])],neighbors:['Religious identity','Moral authority of revelation'],nonEntailments:['The revelation is true','Public law should enforce it'],falsePositives:['A little justification or a need for independent support is not full endorsement.']},
 'audit-EP11-external-world':{proposition:'Ordinary perceived objects exist independently of minds.',evidence:[a('EPI036'),e('EPI037',['mind_independent'],[]),e('EPI034',[],['idealist'])],neighbors:['Direct perception','Representational perception','External-world skepticism'],nonEntailments:['Perceptual certainty','Direct realism'],falsePositives:['An indirect-perception answer is compatible with an external world.']},
 'audit-AH08-biological':{proposition:'Biological differences and inherited dispositions can substantially contribute to differences in human behavior.',evidence:[a('AHI010'),a('AHI018',[-2,-1],[1,2])],neighbors:['Environmental influence','Biological determinism'],nonEntailments:['Traits are immutable','Group inequality is justified'],falsePositives:['Caution about a single twin study is not denial of biological influence.']},
 'audit-AH09-environmental':{proposition:'Social institutions and learned environments can substantially shape behavior.',evidence:[a('AHI019'),a('AHI022')],neighbors:['Biological influence','Blank-slate theory'],nonEntailments:['Biology is irrelevant','Every disposition is malleable'],falsePositives:['Caution about one comparison of groups is not denial of environmental influence.']},
 'audit-RC02-agentic-divinity':{proposition:'If divine reality exists, an intentional or personal character is more likely than a wholly impersonal one.',evidence:[a('RCI002'),a('RCI015',[-2,-1],[1,2]),e('RCI025',['personal'],['impersonal'])],neighbors:['Impersonal divinity','Providence','Miracles'],nonEntailments:['Divine reality exists','A particular tradition is true'],falsePositives:['Partly mind-like is not a fully personal deity.']},
 'audit-RC04-intervention':{proposition:'A divine or supernatural agent can sometimes influence ordinary events.',evidence:[a('RCI009'),a('RCI016',[-2,-1],[1,2])],neighbors:['Deism','Miracles','Providence'],nonEntailments:['A particular event was an intervention','A specific deity exists'],falsePositives:['A natural account of one answered-prayer case does not rule out every intervention.']},
 'audit-RC05-miracles':{proposition:'Events can sometimes occur through miraculous action beyond ordinary natural processes.',evidence:[a('RCI010'),a('RCI017',[-2,-1],[1,2])],neighbors:['Unexplained natural events','General supernatural intervention'],nonEntailments:['A particular recovery was miraculous','Miracles violate a settled law'],falsePositives:['An unexplained recovery is not itself proof of a miracle.']},
 'audit-EX02-nondesigner-purpose':{proposition:'A non-designer source of objective human purpose is a live plausible possibility.',evidence:[a('EXI013'),a('EXI014',[-2,-1],[1,2]),e('EXI012',[],['none'])],neighbors:['Designer-grounded purpose','Constructed subjective meaning'],nonEntailments:['Objective purpose actually exists','A divine reality does not exist'],falsePositives:['Choosing a nondivine source as most plausible does not establish objective purpose.']},
 'audit-SO03-relational-self':{proposition:'Relationships and social roles importantly constitute aspects of personal identity.',evidence:[a('SOI003'),e('SOI027',['greatly'],['little'])],neighbors:['Autonomy','Numerical identity through change'],nonEntailments:['Political collectivism','A person ceases to exist after losing roles'],falsePositives:['Some change in social role need not mean a changed core identity.']},
 'audit-SO05-dominance':{proposition:'Group hierarchy can be acceptable even without individual differences that justify it.',evidence:[a('SOI009'),e('SOI031',['hierarchy_ok'],['oppose_hierarchy'])],neighbors:['Hierarchy justified by individual merit','Group-status equality'],nonEntailments:['Support for a particular party','A calibrated SDO-7 score'],falsePositives:['Rejecting status merely from supposed superiority is compatible with other hierarchies.']},
 'audit-SO06-anti-egalitarian':{proposition:'Reducing group-status inequality is not intrinsically important.',evidence:[a('SOI010'),e('SOI032',['not_itself','oppose'],['important'])],neighbors:['Group dominance','Objections to unjustified inequality'],nonEntailments:['Preference for domination','A calibrated SDO-7 score'],falsePositives:['A concern about unjustified hierarchy does not settle whether equality matters in itself.']},
 'audit-SO09-moral-scope':{proposition:'In a matched serious-harm case, a stranger abroad can have a moral claim as weighty as a community member.',evidence:[a('SOI004'),e('SOI029',[1,2],[-2,-1])],neighbors:['Special obligations to family','Institutional cosmopolitanism'],nonEntailments:['All relationships carry identical duties','Open-borders policy'],falsePositives:['Giving priority to a close associate in another context does not deny equal stranger claims.']},
 'audit-SO13-just-world':{proposition:'People generally tend to receive fortunes that correspond to what they deserve.',evidence:[a('SOI037'),a('SOI038',[-2,-1],[1,2])],neighbors:['Personal just-world belief','Desert as a moral ideal'],nonEntailments:['A specific victim deserved harm','A validated just-world scale score'],falsePositives:['Believing justice desirable is not believing it generally happens.']},
 'audit-PL05-decentralization':{proposition:'Political decision authority should generally favor smaller or overlapping institutions over uniform central rules.',evidence:[a('PLI004'),a('PLI003',[-2,-1],[1,2]),e('PLI050',[1,2],[-2,-1])],neighbors:['Federalism','Subsidiarity','Local variation for pragmatic reasons'],nonEntailments:['A specific constitutional arrangement','All central coordination is illegitimate'],falsePositives:['The mirror pair is one authored evidence unit, not two independent observations.']},
 'audit-PL25-reform':{proposition:'In deeply defective institutions, a decisive institutional break can deserve priority over continued gradual reform or continuity.',evidence:[e('PLI076',[-2,-1],[1,2]),a('PLI077')],neighbors:['Routine gradual reform','Violent revolution','Secession'],nonEntailments:['Violent means are justified','Every institution requires replacement'],falsePositives:['A response to repeatedly failed reforms should not be generalized to every political disagreement.']}
};

// Draft candidate additions are deliberately outside every released bank and
// route. Their value is discrimination for later review, not automatic mapping.
export const draftItems=[
 {id:'EPI118',revision:1,domainId:'EP',constructId:'EP03',responseType:'single_choice',responseScaleId:'single_choice',text:'A factual claim has survived independent, repeatable tests and no rival explanation fits the evidence. Which conclusion is closest to your view?',options:[
  {id:'fallible_knowledge',label:'It can be known as objectively correct while remaining open to revision.'},
  {id:'support_only',label:'It can be strongly supported, but never known as objectively correct.'},
  {id:'case_dependent',label:'That depends on the kind of factual claim and what the tests establish.'},
  {id:'practical_only',label:'Calling it correct mainly records that it works for now.'}
 ],reason:'Separates fallible knowledge from certainty demands and merely practical success. The case does not by itself settle global attainability.'},
 {id:'AHI106',revision:1,domainId:'AH',constructId:'AH01',responseType:'single_choice',responseScaleId:'single_choice',text:'Which claim is closest to your view about human free will?',options:[
  {id:'some_free_will',label:'People sometimes act with genuine free will, whatever its correct explanation is.'},
  {id:'conditional_free_will',label:'People can have free will, but only if a further condition on control is met.'},
  {id:'no_free_will',label:'No human action involves genuine free will.'},
  {id:'undecided',label:'I do not have a settled view of whether genuine free will exists.'}
 ],reason:'Separates outright denial from theories that require special conditions; a compatibilist answer alone cannot do this.'}
];

export const contentFindings=[
 {kind:'semantic_redundancy',itemIds:['AHI006','AHI015'],finding:'Both use frequent other-regarding behavior as evidence; they do not independently settle capacity for altruism.'},
 {kind:'local_dependence',itemIds:['PLI003','PLI004'],finding:'The centralization mirror pair shares one authored unit and must not count as two independent answers.'},
 {kind:'missing_facet',itemIds:['PLI012','PLI032','PLI053'],finding:'Rankings do not independently identify equality, need, desert, sufficiency, priority, and entitlement.'},
 {kind:'missing_facet',itemIds:['AHI001','AHI012','AHI023','AHI034'],finding:'The free-will items do not distinguish outright denial from incompatible theories of genuine control.'},
 {kind:'missing_facet',itemIds:['PLI014','PLI034','PLI059'],finding:'Relative property preference does not test whether commons could be legitimate alongside private ownership.'},
 {kind:'missing_facet',itemIds:['PLI018','PLI041','PLI065'],finding:'Deterrence as one aim, sufficient justification, and proportional limits need separate answer patterns.'},
 {kind:'philosophy_knowledge',itemIds:['EPI025'],finding:'Recognizing a textbook a priori example is not a report of worldview and remains excluded from public forms.'},
 {kind:'double_barreled',itemIds:['AHI006','AHI007','AHI016','PLI019','PLI042','SOI007'],finding:'These combine distinct motivations, purposes, or descriptive and normative claims.'},
 {kind:'presupposition',itemIds:['EXI011','RCI028'],finding:'Hypothetical no-purpose and believed-genuine revelation conditions must not be treated as actual-world commitments.'},
 {kind:'awkward_reverse_key',itemIds:['PLI024','PLI041','PLI037'],finding:'Negating automatic authority, sufficient deterrence, or expertise alone does not assert the opposite broad proposition.'},
 {kind:'proxy_risk',itemIds:['PLI060','PLI061'],finding:'Workplace and technical-decision cases are context-bound and do not identify a partisan or universal governance position.'},
 {kind:'repeated_wording',itemIds:['RCI009','RCI010','RCI016','RCI017'],finding:'Possibility versus impossibility pairs are useful checks but should not be presented as psychometrically independent.'}
];
