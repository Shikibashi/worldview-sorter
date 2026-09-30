import {readFile,writeFile} from 'node:fs/promises';
import {validateProposal} from '../packages/governance/index.js';
const root=new URL('../',import.meta.url),read=async file=>JSON.parse(await readFile(new URL(file,root)));
const catalog=await read('data/affinities/catalog-v1.7.json');
const act=catalog.traditions.find(row=>row.id==='act-consequentialism-scoped');
const rule=catalog.traditions.find(row=>row.id==='rule-consequentialism-scoped');
const claims=[...act.sourceClaims,...rule.sourceClaims];
const now='2026-09-30T21:10:00Z';
const basis={proposition:'Two scoped act and rule consequence criteria are compared only through the existing direct public propositions.',
 neighboringViews:['generic outcome concern','rule-guided decision procedure','deontological rule constraint','utilitarianism'],
 nonEntailments:['No complete philosophical identity follows.','Neither criterion alone establishes a theory of value, welfare aggregation, or hedonism.'],
 existingGap:'The model already interprets NE22 and NE23, but the public catalog does not yet expose their doctrinal contrast.',
 scholarlyDisagreement:'SEP distinguishes direct versus rule-based criteria, decision procedures, value theories, and rival rule-consequentialist formulations.'};
const target='model-release-1.9.0';
const common={schemaVersion:'model-change-proposal-1',author:'Worldview Sorter AI editorial review',status:'approved',
 tests:{required:['positive','negative','mixed','missing','false_positive_neighbor','historical'],
  paths:['scripts/test-act-rule-affinity-release.mjs']},
 implementationRefs:['scripts/build-act-rule-affinities-v1.mjs','scripts/test-act-rule-affinity-release.mjs',
  'docs/governance/ACT_RULE_AFFINITY_REVIEW.md'],
 respondentImpact:'Only two already interpreted direct criteria can establish scoped overlap or divergence. Quick and Standard remain unmeasured; no identity, rank, or percentage is produced.',
 historicalCompatibility:'Model release 1.8.0 and its nine-entry catalog, route item sets, and result snapshots remain pinned. No raw answer or interpretation rule changes.',
 review:{approvals:[
  {role:'philosophical',reviewer:'Worldview Sorter AI editorial review',at:now,
   note:'Reviewed SEP Consequentialism and SEP Rule Consequentialism, including act/rule criteria, decision procedure, value theory, and disputed formulations.'},
  {role:'engineering',reviewer:'Worldview Sorter AI editorial review',at:now,
   note:'Checked exact NEI122/NEI014/NEI123 evidence units, route omissions, near-neighbor fixtures, and historical catalog replay.'},
  {role:'linguistic',reviewer:'Worldview Sorter AI editorial review',at:now,
   note:'Canonical English only. Spanish and Arabic remain unavailable draft targets pending translation review.'}]},
 currentBehavior:'Nine public comparisons omit the two direct consequence criteria.',
 proposedBehavior:'Add two scoped doctrine comparisons; retain missing value theory and internal variation explicitly.',
 rationale:'These released propositions can support a careful doctrinal comparison without new questions or stronger inference.',
 alternatives:['Infer utilitarianism: rejected because value theory, aggregation, and other defining doctrine remain unmeasured.',
  'Map generic outcome concern: rejected because it does not distinguish act, rule, and duty criteria.'],
 sourceClaims:claims,philosophicalBasis:basis};
const specs=[
 ['059','Add scoped act-consequentialist comparison','tradition','new_object',[{type:'tradition',id:act.id}],['affinity']],
 ['060','Add scoped rule-consequentialist comparison','tradition','new_object',[{type:'tradition',id:rule.id}],['affinity']],
 ...[...act.commitments.map(row=>({tradition:act,criterion:row})),
     ...rule.commitments.map(row=>({tradition:rule,criterion:row}))].map(({tradition,criterion},index)=>[
  String(index===0?61:64+index).padStart(3,'0'),
  'Pin '+tradition.name+' criterion '+criterion.id,'criterion','new_object',
  [{type:'criterion',id:tradition.id+'/'+criterion.id}],['affinity']]),
 ['062','Version catalog sources and route binding','route','semantic_clarification',
  [{type:'route',id:'quick'},{type:'route',id:'standard'},{type:'route',id:'full'},
   {type:'route',id:'route-policy'}],['progressive_routes']],
 ['063','Keep locale availability explicit for consequence comparisons','localization','semantic_clarification',
  [{type:'localization',id:'catalog/model-binding'},...['en-US','es-ES','ar'].flatMap(locale=>[
   {type:'localization',id:'catalog/'+locale},{type:'localization',id:'bundle/'+locale}])],['localization_catalog']],
 ['064','Register academic claims in the affinity catalog','source','new_object',
  claims.map(row=>({type:'source',id:row.sourceId})),['affinity']]
];
for(const [num,title,objectType,changeClass,affectedObjects,components] of specs){
 const proposal={...common,proposalId:'MCP-2026-'+num,title,objectType,changeClass,affectedObjects,
  release:{targetVersion:target,migration:'No data migration; old administrations retain their pinned release and catalog.',
   components}};
 if(objectType==='tradition')proposal.philosophicalBasis={...basis,
  proposition:(affectedObjects[0].id===act.id?act:rule).commitments[0].doctrine};
 if(objectType==='criterion')proposal.philosophicalBasis={...basis,
  proposition:catalog.traditions.flatMap(row=>row.commitments.map(c=>({
   id:row.id+'/'+c.id,doctrine:c.doctrine}))).find(row=>row.id===affectedObjects[0].id).doctrine};
 validateProposal(proposal);
 await writeFile(new URL('data/governance/proposals/'+proposal.proposalId+'.json',root),
  JSON.stringify(proposal,null,2)+'\n',{flag:'wx'});
}
console.log('Approved '+specs.length+' source, tradition, criterion, route, and localization proposals.');
