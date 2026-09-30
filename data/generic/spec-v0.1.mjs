// All mappings below are authored interpretation rules, not learned coefficients.
const S=(id,title,slug,locator,claim)=>({id,title,url:'https://plato.stanford.edu/entries/'+slug+'/',locator,claim,access:'selected_sections_reviewed',evidenceType:'signed_scholarly_analysis',reviewedOn:'2026-09-28',itemReuse:'No item wording copied; conceptual reference only.'});
export const sources=[
 S('gen-consequentialism','Consequentialism','consequentialism','Introduction and classical consequentialism','Consequentialist theories differ in what is evaluated and which consequences matter; considering consequences alone does not establish consequentialism.'),
 S('gen-deontology','Deontological Ethics','ethics-deontological','Introduction and types of deontological theory','Constraints, permissions and agent-relative duties are not interchangeable with a single consequence-insensitivity score.'),
 S('gen-virtue','Virtue Ethics','ethics-virtue','Introduction and varieties','Character, practical wisdom and flourishing figure differently across virtue-ethical approaches.'),
 S('gen-contractualism','Contractualism','contractualism','Sections 1–3','Reasonable rejection by persons differs from bargaining for mutual advantage and from aggregation.'),
 S('gen-wellbeing','Well-Being','well-being','Sections 1 and 4','Personal value priorities, moral rightness and theories of what is good for someone are distinct.'),
 S('gen-naturalism','Naturalism','naturalism','Ontological and methodological naturalism','Naturalistic methods and claims about what exists are distinguishable.'),
 S('gen-physicalism','Physicalism','physicalism','Formulating physicalism and varieties','Physicalism does not require one simple reductionist theory or decide every abstract-object question.'),
 S('gen-agency','Free Will','freewill','Compatibilism and incompatibilism','Belief in determinism does not settle whether freedom is compatible with it.'),
 S('gen-theology','Atheism and Agnosticism','atheism-agnosticism','Definitions and agnosticism','Theological belief, suspended judgment and epistemic claims about knowledge must be distinguished.'),
 S('gen-meaning','The Meaning of Life','life-meaning','Naturalism, supernaturalism and nihilism','Objective meaning need not require a cosmic designer; absence of cosmic purpose is not absence of every kind of meaning.'),
 S('gen-liberty','Positive and Negative Liberty','liberty-positive-negative','Sections 1, 4 and 6','Noninterference, self-direction and non-domination involve distinct questions and do not by themselves determine a complete politics.'),
 S('gen-distribution','Distributive Justice','justice-distributive','Equality, welfare, desert and libertarian principles','Distributive principles are competing and sometimes overlapping reasons, not synonyms for parties or single-policy preferences.'),
 S('gen-identity','Personal Identity','identity-personal','Persistence and psychological approaches','Bodily continuity, psychological continuity and practical concern need not coincide.'),
 S('gen-extended','Embodied Cognition','embodied-cognition','Section 2.3 and constitution through coupling','Embedded causal support and constitutive cognitive extension are different claims.'),
 S('gen-law','Legal Positivism','legal-positivism','Social facts, sources and morality','A position about legal validity does not itself establish a moral duty to obey law.'),
 S('gen-realism','Moral Realism','moral-realism','Introduction and truth/objectivity distinctions','Truth-aptness and actual moral truth are distinct commitments; realism is not inferred from tolerance.'),
 S('gen-antirealism','Moral Anti-Realism','moral-anti-realism','Introduction and varieties','Anti-realism includes different positions; disagreeing with realism does not uniquely select one.'),
 S('gen-noncognitivism','Moral Cognitivism vs. Non-Cognitivism','moral-cognitivism','Introduction and quasi-realism','Sophisticated expressivist accounts can accommodate truth-talk; one truth-aptness answer cannot identify the whole theory.'),
 {id:'gen-values',title:'Schwartz (2012): An Overview of the Schwartz Theory of Basic Values',url:'https://scholarworks.gvsu.edu/orpc/vol2/iss1/11/',locator:'Author abstract and conceptual overview',claim:'Value priorities differ from attitudes, beliefs, norms and personality traits. The basic value model describes relations among motivations.',access:'abstract_reviewed',evidenceType:'author_theoretical_overview',reviewedOn:'2026-09-28',itemReuse:'No questionnaire wording reused.'},
 {id:'gen-care',title:'Care Ethics',url:'https://iep.utm.edu/care-ethics/',locator:'Definition, development and challenges',claim:'Relational moral reasoning is not identical to a generic desire to prevent harm.',access:'selected_sections_reviewed',evidenceType:'signed_scholarly_analysis',reviewedOn:'2026-09-28',itemReuse:'Theory only; no question copying.'}
];
export const methodologicalRules=[
 ['scope-not-identity','A result concerns explicitly reported commitments under specified wording, never an inferred personal identity.'],
 ['no-data-transfer','Published instrument structure or validation does not validate our rewritten items or authorize copied wording.'],
 ['no-complement-shortcut','Disagreement with one proposition does not identify a different school without its own direct evidence.'],
 ['no-context-shortcut','A tradeoff, dilemma or ranking does not establish a context-free doctrinal preference.'],
 ['no-source-vote','More citations or more profile variants do not add respondent evidence.'],
 ['no-personal-prior','Memories, expected identities, demographic categories, country/figure matches and preferred outcomes cannot supply answers.'],
 ['source-access','Metadata-only sources remain references, not reviewed evidence for detailed wording.'],
 ['no-universal-coverage','The corpus is selected and largely Anglophone; no universal cultural coverage or measurement invariance is claimed.']
];
const e=(itemId,support,oppose=[],unitId=null)=>({itemId,support,oppose,unitId});
const a=(itemId,polarity=1)=>e(itemId,polarity===1?[1,2]:[-2,-1],polarity===1?[-2,-1]:[1,2]);
const C=(id,constructId,label,layer,sourceIds,evidence,boundary)=>({id,constructId,label,layer,sourceIds,evidence,boundary});
export const commitments=[
 C('outcomes-count','NE01','Consequences count as moral reasons','normative',['gen-consequentialism'],[a('NEI001'),e('NEI025',['decisive','strong'],['little'])],'Does not establish exclusive consequentialism or aggregate maximization.'),
 C('moral-constraints','NE02','Moral constraints can limit beneficial actions','normative',['gen-deontology'],[a('NEI002'),e('NEI026',['constraint_holds','strong_presumption'],['consequences_dominate'])],'Threshold exceptions and absolute prohibitions remain different.'),
 C('character-counts','NE03','Character contributes to moral assessment','normative',['gen-virtue'],[a('NEI003'),e('NEI027',['major_difference','some_difference'],['no_difference'])],'Not sufficient to identify a particular virtue-ethical tradition.'),
 C('relational-care','NE04','Care relationships generate moral reasons','normative',['gen-care'],[a('NEI006'),e('NEI028',['strongly_yes','somewhat_yes'],['no'])],'Relationship-specific reasons are not a general Care-foundation score.'),
 C('reasonable-rejection','NE05','Reasonable rejection constrains common rules','normative',['gen-contractualism'],[a('NEI009'),e('NEI031',['rejection_matters_strongly'],['aggregate_controls'])],'Partial evidence of a contractualist consideration, not the whole Scanlonian theory.'),
 C('mutual-advantage','NE06','Mutual advantage helps justify moral rules','normative',['acad-contractarianism','gen-contractualism'],[a('NEI010'),e('NEI032',['mutual_advantage'],[])],'Other justifications may coexist; choosing another reason is not counted as rejection.'),
 C('impartial-beneficence','NE07','Equal interests count without personal proximity','normative',['acad-ous','gen-consequentialism'],[a('NEI004'),a('NEI044')],'Neither willingness to harm nor a utilitarian identity follows.'),
 C('instrumental-harm','NE08','Instrumental harm can be permissible','normative',['acad-ous'],[e('NEI005',['usually','required'],['never']),e('NEI030',['permissible','required'],['never'])],'These scenarios do not measure all consequentialist commitments; exceptional answers remain qualified.'),
 C('natural-world','OM01','Reality is entirely natural','ontological',['gen-naturalism'],[a('OMI009'),e('OMI011',['natural_only'],['supernatural_real'])],'Atheism, science preference and reductionism are not substitutes for these answers.'),
 C('physical-reality','OM02','Physicalism about fundamental reality','ontological',['gen-physicalism'],[a('OMI002'),e('OMI012',['physical'],['nonphysical'])],'Emergence and the existence of abstract objects are separate questions.'),
 C('extended-cognition','MS05','Cognitive systems can include external tools','ontological',['gen-extended'],[a('MSI004'),e('MSI012',['part_of_mind'],['tool_only'])],'A useful tool is not automatically part of a mind. This is a narrow reported judgment.'),
 C('psychological-continuity','MS03','Psychological continuity matters to persistence','ontological',['gen-identity'],[a('MSI002'),e('MSI022',['brain_person'],['body_person'])],'Concern for a duplicate is not identical to numerical identity.'),
 C('deterministic-world','AH02','The same total state and laws fix one future','descriptive',['gen-agency','acad-fwi'],[a('AHI002'),a('AHI013',-1)],'Does not establish incompatibilism or remove moral responsibility.'),
 C('divine-existence','RC01','Some divine reality probably exists','ontological',['gen-theology'],[a('RCI014'),e('RCI021',['high','very_high'],['low','very_low'])],'Neither religious practice nor support for religious law is inferred.'),
 C('theological-suspension','RC01','Judgment about divine existence is suspended','epistemic',['gen-theology'],[e('RCI001',['uncertain'],['personal_divine','probably_none','none']),e('RCI021',['uncertain'],['very_low','very_high'])],'An explicit suspended judgment is not the same as no-view, and is not an atheist score.'),
 C('afterlife-belief','RC07','Personal persistence after death','ontological',['gen-theology'],[a('RCI004'),e('RCI023',['some_persistence','personal_continuation'],['ends'])],'Afterlife belief does not establish belief in a creator or any named religion.'),
 C('constructed-meaning','EX03','Projects and relationships can create meaning','existential',['gen-meaning'],[a('EXI002'),e('EXI010',['genuine_meaning','personal_meaning'],['no_meaning'])],'Can coexist with objective meaning; absence of cosmic purpose is not pessimism.'),
 C('objective-meaning','EX01','Meaning can exceed subjective experience','existential',['gen-meaning'],[a('EXI001'),e('EXI008',['objective','both'],['none'])],'Not necessarily divine purpose, religion or an objective-list theory of welfare.'),
 C('noninterference','PL06','Interference with harmless choice reduces liberty','institutional_normative',['gen-liberty'],[a('PLI007'),e('PLI051',['major','some'],['none'])],'Does not select a party, economic system, or position on all positive freedoms.'),
 C('nondomination','PL07','Uncontrolled power itself can diminish freedom','institutional_normative',['gen-liberty'],[a('PLI010'),e('PLI057',['unfree','somewhat'],['free_if_benevolent'])],'Do not infer arbitrary control from every dependence or infer a complete republican ideology.'),
 C('effective-freedom','PL08','Effective opportunities matter to freedom','institutional_normative',['gen-liberty'],[a('PLI011'),e('PLI058',['low','some'],['high'])],'Does not establish socialism, authoritarianism or a particular distribution policy.'),
 C('procedural-justice','PL16','Fair procedures have independent justificatory weight','institutional_normative',['gen-distribution'],[a('PLI015'),e('PLI062',['substantial','some'],['none'])],'Can coexist with substantive outcome concerns.'),
 C('substantive-justice','PL17','Fair procedure can leave an unjust outcome','institutional_normative',['gen-distribution'],[a('PLI016'),e('PLI063',['correct_outcome'],['procedure_controls'])],'Not a denial of due process or endorsement of any party.'),
 C('source-based-validity','PL21','Immorality need not invalidate a law','legal_conceptual',['gen-law'],[a('PLI071'),e('PLI073',['valid_but_unjust'],['not_law'])],'Legal validity does not establish moral obligation or approval of the law.'),
 C('moral-limits-validity','PL21','Extreme injustice may undermine legal status','legal_conceptual',['gen-law'],[a('PLI072'),e('PLI073',['not_law','defective_law'],['valid_but_unjust'])],'A limited natural-law comparison, not a complete religious or political identity.')
];
export const foundationRules=[
 ['MF01','care','MFI013','MFI023',['very','strong'],['little']],
 ['MF02','equality','MFI014','MFI024',['very','some'],['none']],
 ['MF03','proportionality','MFI015','MFI025',['very','some'],['none']],
 ['MF04','loyalty','MFI016','MFI026',['very','some'],['none']],
 ['MF05','authority','MFI017','MFI027',['very','some'],['none']],
 ['MF06','purity','MFI018','MFI028',['very','some'],['none']]
];
export const unsupportedInferences=[
 ['VA04','VA20','Personal pleasure priority does not establish hedonism as a theory of welfare.'],
 ['NE01','NE08','Consequences mattering does not entail permissive instrumental harm.'],
 ['MF01','NE04','Harm concern is not identical to relational moral reasoning.'],
 ['MF02','PL10','Equality concern does not uniquely select a distributive doctrine.'],
 ['RC01','PL26','Private divine belief does not determine religious public authority.'],
 ['RC01','OM02','Atheism or theism does not determine physicalism.'],
 ['AH02','AH14','Determinism and incompatibilism are different propositions.'],
 ['SO14','SO15','Institution-dependent social entities do not determine moral priority of groups.'],
 ['PL21','PL02','Legal validity does not establish a duty to obey.'],
 ['EP15','ME01','Epistemic fallibilism does not establish moral anti-realism.'],
 ['EX01','RC08','Objective meaning does not require cosmic purpose.'],
 ['OM14','OM11','Easy ontological methods do not decide which abstract objects exist.']
];
export const readinessGaps=[
 {id:'culture-coverage',reason:'No generic Buddhism, Hinduism, Confucianism or Indigenous-worldview label may be derived from theism, authority or no-self answers. Dedicated primary scholarship and discriminating items are still required.'},
 {id:'utilitarian-system',reason:'Consequence sensitivity and instrumental harm do not measure outcome-only rightness, aggregation, maximizing versus satisficing, and scope well enough to assert full utilitarianism.'},
 {id:'constructivist-variants',reason:'The corpus recognizes constructivist objectivity and competing Kantian/Humean variants; the bank lacks sufficient direct procedural-grounding discriminants for a full comparison.'},
 {id:'ideology-families',reason:'Socialism, liberalism, conservatism and religious traditions have internal variants; policy resemblance alone is insufficient for full-system identities.'},
 {id:'legacy-wording',reason:'Some legacy reverse-keyed items and forced choices contain insufficient-conditions or ambiguity problems; only explicit reviewed mappings enter comparisons.'},
 {id:'full-corpus',reason:'All repository academic references are inventoried with access limits. This is not all academic literature, all datasets, or proof of universal cultural coverage.'}
];
