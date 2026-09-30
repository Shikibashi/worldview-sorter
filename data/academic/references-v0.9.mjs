// Reference comparisons, not mutually exclusive identities or population classes.
const Q = (id, constructId, expected, essential = true) => ({id, constructId, expected, essential});
const P = (id, label, scope, sourceIds, criteria, limitations = []) => ({id, label, scope, sourceIds, criteria, limitations});
export const referenceProfiles = [
  P('objectivism', 'Objectivism: selected commitments in Rand’s formulation',
    'A comparison to specified philosophical commitments, not a claim to exhaust the system or settle disputes among its interpreters.',
    ['acad-rand','acad-rand-epistemology'], [
      Q('life-grounded-ethics','ME09','endorse'),
      {id:'moral-truth-aptness', essential:true, existingItems:[
        {itemId:'MEI017', support:[1,2], oppose:[-2,-1]},
        {itemId:'MEI018', support:['truth_claim'], oppose:['attitude','prescription']}
      ]},
      Q('normative-self-interest','NE15','endorse'),
      Q('perception-and-reason','EP20','endorse'),
      Q('external-reality','OM13','endorse'),
      Q('preinstitutional-rights','PL27','endorse'),
      Q('final-legal-authority','PL29','endorse'),
      Q('volitional-incompatibilism','AH14','endorse'),
      {id:'market-coordination', essential:true, existingItems:[
        {itemId:'PLI035', support:[-2,-1], oppose:[1,2]},
        {itemId:'PLI055', support:[-2,-1], oppose:[1,2]}
      ]},
      Q('life-choice-conditionality','ME10','endorse',false)
    ], [
      'Fallible propositional judgment does not disqualify this comparison.',
      'Revisable definitions and concepts as human integrations do not disqualify this comparison.',
      'No generic a-priori rationalism, universal-realism, reductive physicalism, or unconditional duty-to-obey gate is used.',
      'The status of choice-to-live reasons and the survival/flourishing interpretation are disputed; the optional criterion cannot exclude.',
      'Other commitments of Objectivism remain untested. Passing these items is not sufficient to establish an identity.'
    ]),
  P('ownness-orientation', 'Ownness without a universal self-interest obligation',
    'A restricted, non-moralized reading of Stirnerian ownness; not a comprehensive classification of Stirner or of people influenced by him.',
    ['acad-stirner','acad-egoism'], [
      Q('revisable-ideals','NE17','endorse'), Q('no-universal-egoistic-command','NE15','reject'),
      Q('elective-concern','NE21','endorse',false), Q('revisable-association','NE19','endorse',false)
    ], ['No requirement of greed, isolation, rejection of affection, or a particular market/state program.']),
  P('philosophical-anarchism', 'Skepticism of general political obligation',
    'The philosophical-anarchist position about a general content-independent duty to obey, not a policy of immediate institutional abolition.',
    ['acad-obligation','acad-legitimacy','acad-simmons'], [
      {id:'no-general-obedience', essential:true, existingItems:[
        {itemId:'PLI002', support:[-2,-1], oppose:[1,2]},
        {itemId:'PLI025', support:[1,2], oppose:[-2,-1]},
        {itemId:'PLI048', support:['no_independent_reason'], oppose:['strong_reason','some_reason']}
      ]},
      Q('institutions-can-still-help','PL31','endorse',false)
    ], ['No automatic inference about state abolition, voting, the usefulness of courts, or violence.']),
  P('nonstate-legal-pluralism', 'Nonstate legal and protective provision',
    'Institutional openness to nonstate adjudication and protection without an exclusive territorial authority. Not all polycentric governance takes this form.',
    ['acad-hasnas','acad-legitimacy'], [Q('nonstate-provision','PL30','endorse'),Q('no-necessary-monopoly','PL29','reject')],
    ['Possibility claims do not demonstrate practical success under every set of conditions.', 'Ostrom’s polycentric analysis is not classified as necessarily anarchist.']),
  P('pragmatic-inquiry', 'Pragmatic clarification and revisable inquiry',
    'Methodological affinity, not a verdict that someone belongs to every pragmatist tradition.',
    ['acad-pragmatism'], [Q('consequences-clarify','EP16','endorse'),Q('concepts-as-tools','EP17','endorse'),Q('fallible-knowledge','EP15','endorse',false)],
    ['No inference of atheism, nominalism, relativism, instrumentalist truth, or anti-realism.']),
  P('easy-metaontology', 'Easy or deflationary ontological method',
    'Method of settling existence questions; not an inventory of which things exist.',
    ['acad-marschall','acad-thomasson'], [Q('ordinary-criteria','OM14','endorse')],
    ['No universal-realism, abstract-object, or external-world verdict is inferred from this method.', 'Compatibility with realism is a live scholarly dispute, not a solved taxonomy.']),
  P('ethical-egoism', 'Ethical egoism',
    'A normative orientation about whose good should be the ultimate moral end, separate from descriptive motives.',
    ['acad-egoism'], [Q('self-good-as-moral-end','NE15','endorse')],
    ['Does not imply psychological egoism, an Objectivist identity, a political institution, or indifference to friends.']),
  P('preinstitutional-rights', 'Preinstitutional moral-rights grounding',
    'One possible justification of rights, not a complete ideology.',
    ['acad-rights'], [Q('rights-before-recognition','PL27','endorse')],
    ['May coexist with instrumental justifications or with either minarchist or anarchist institutional preferences.']),
  P('institutional-rights', 'Institutional justification of rights',
    'Attention to what stable rights do for agency and cooperation, not automatically utilitarianism.',
    ['acad-rights','acad-contractarianism'], [Q('institutional-reasons','PL28','endorse')],
    ['No automatic reduction to welfare maximization or denial of strong constraints.'])
];
export const unresolvedAudit = [
  {id:'legacy-collectivism', constructs:['SO01','SO02','SO14','SO15'], status:'isolated_from_profile_inference', issue:'Some legacy items conflate group agency, descriptive dependence and normative priority. New distinctions must not be collapsed back into SO02.'},
  {id:'legacy-abstracts-universals', constructs:['OM03','OM11','OM12'], status:'legacy_score_deprecated', issue:'OM03 bundled distinct ontological disputes. Retain its ID for historical decoding; new outputs use OM11 and OM12.'},
  {id:'foundations-vs-ethics', constructs:['MF01','NE04','NE07'], status:'empirical_discriminant_validation_needed', issue:'Care concern, relational reasoning and impartial beneficence are related but not the same variable.'},
  {id:'values-module', constructs:['VA01','VA20'], status:'original_items_not_PVQ_RR', issue:'The existing values bank was inspired by Schwartz; it is not a licensed administration or validation of the published PVQ-RR.'},
  {id:'sampling-for-diagnosis', constructs:[], status:'followup_planner_added_not_deployed', issue:'A domain-proportional packet may not contain enough discriminating evidence. Missing criteria stay unresolved; no inferred answer may replace them.'},
  {id:'response-method', constructs:[], status:'empirical_validation_needed', issue:'Different response formats need not measure the same trait even when they share a theoretical target.'}
];
