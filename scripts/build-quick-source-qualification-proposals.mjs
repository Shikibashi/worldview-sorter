import {readFile,writeFile} from 'node:fs/promises';
import {validateProposal} from '../packages/governance/index.js';

const root=new URL('../',import.meta.url);
const model=JSON.parse(await readFile(new URL('data/generic/model-v1.8-pilot.json',root)));
const selected=['audit2-EP06-testability'].map(id=>model.commitments.find(row=>row.id===id));
const sourceClaims=selected.flatMap(rule=>rule.sourceClaims);
const now='2026-09-30T23:00:00Z',target='model-release-1.11.0';
const common={schemaVersion:'model-change-proposal-1',author:'Worldview Sorter AI editorial review',status:'approved',
 currentBehavior:'The Quick-route public-testability rule has an exact proposition and direct evidence, but no rule-linked supporting academic claim.',
 proposedBehavior:'Pin one narrow scholarly claim to the existing public-testability rule. Do not change questions, answer directions, thresholds, or affinity doctrine.',
 rationale:'Reviewed both item wordings and the SEP discussion. Public explanations can trace the conceptual basis while retaining explicit non-entailments and neighboring false positives.',
 philosophicalBasis:{proposition:selected[0].proposition,
  neighboringViews:['scientism','private experiential justification','reliance on testimony'],
  nonEntailments:['Public testing is infallible or the only possible source of knowledge.',
   'Private experience has no personal evidential value.'],
  existingGap:'Quick had zero rule-linked supporting source claims despite 30 direct interpretation opportunities.',
  scholarlyDisagreement:'Philosophers dispute the theory-ladenness and evidential role of observation. The claim is restricted to the comparison actually asked.'},
 sourceClaims,alternatives:[
  'Promote expert consensus now: rejected because substantial versus little leaves a magnitude gap in opposing answers.',
  'Promote revelation now: rejected because first-person and public factual warrant remain ambiguous.',
  'Promote AH14 now: rejected because its two Quick items repeat the fixed-prior-condition framing without the compatibilist alternative.',
  'Add new testability questions: rejected because the existing principle and paired-choice question address the narrow comparison.'
 ],respondentImpact:'One existing Quick result gains a rule-linked conceptual source. No respondent answer or evidence state changes.',
 historicalCompatibility:'Model release 1.10.0 and all earlier item, route, source, localization, and result files remain immutable. New bindings receive successor version paths.',
 tests:{required:['positive','negative','mixed','missing','false_positive_neighbor','historical'],
  paths:['scripts/test-quick-source-qualification-release.mjs']},
 review:{approvals:[
  {role:'philosophical',reviewer:'Worldview Sorter AI editorial review',at:now,
   note:'Reviewed SEP public observation discussion against exact item meanings and non-entailments; AH14 was held under its prior evidence review.'},
  {role:'engineering',reviewer:'Worldview Sorter AI editorial review',at:now,
   note:'Confirmed 64/120/243 item refs, evidence mappings, negative and mixed states, and historical release separation.'},
  {role:'linguistic',reviewer:'Worldview Sorter AI editorial review',at:now,
   note:'Canonical English items are unchanged; draft Spanish and Arabic remain unavailable pending meaning review.'}]},
 implementationRefs:['scripts/build-quick-source-qualification-v1.mjs',
  'scripts/test-quick-source-qualification-release.mjs','docs/governance/QUICK_SOURCE_QUALIFICATION_REVIEW.md']};
const specs=[
 ['076','Add reviewed SEP public-testability source claim','source','new_object',
  sourceClaims.map(c=>({type:'source',id:c.sourceId})),['sources','source_ledger','model']],
 ['077','Qualify public testability with exact supporting claim','proposition','semantic_clarification',
  [{type:'proposition',id:'audit2-EP06-testability'}],['model']],
 ['078','Preserve route opportunity and rebind unchanged route items','route','semantic_clarification',
  ['quick','standard','full','route-policy'].map(id=>({type:'route',id})),
  ['progressive_routes','full_form','pilot']],
 ['079','Version locale bindings for the source-qualified proposition','localization','semantic_clarification',
  [{type:'localization',id:'catalog/model-binding'},...['en-US','es-ES','ar'].flatMap(locale=>[
   {type:'localization',id:'catalog/'+locale},{type:'localization',id:'bundle/'+locale}])],
  ['localization_catalog']],
 ['080','Rebind catalog and result policies without new affinity','result_semantics','semantic_clarification',
  [{type:'result_semantics',id:'affinity-catalog-policy'},
   {type:'result_semantics',id:'model-policy'}],['affinity','model']]
];
for(const [num,title,objectType,changeClass,affectedObjects,components] of specs){
 const proposal={...common,proposalId:'MCP-2026-'+num,title,objectType,changeClass,affectedObjects,
  release:{targetVersion:target,migration:'No raw response rewrite; historical records retain pinned releases.',components}};
 if(num==='077')proposal.philosophicalBasis={...common.philosophicalBasis,
  proposition:selected[0].proposition};
 validateProposal(proposal);
 await writeFile(new URL('data/governance/proposals/'+proposal.proposalId+'.json',root),
  JSON.stringify(proposal,null,2)+'\n',{flag:'wx'});
}
console.log('Approved '+specs.length+' source, proposition, route, locale, and result-binding proposals.');
