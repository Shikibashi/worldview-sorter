// Review records for the two scoped epistemic comparisons. Run after building
// the successor artifacts; the resulting JSON is committed for release review.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateProposal} from '../packages/governance/index.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const model=await read('data/generic/model-v1.4-pilot.json');
const catalog=await read('data/affinities/catalog-v1.4.json');
const test='scripts/test-epistemic-affinity-release.mjs';
const required=['positive','negative','mixed','missing','false_positive_neighbor','historical'];
const shared={schemaVersion:'model-change-proposal-1',author:'Worldview Sorter AI editorial review',
 status:'approved',tests:{required,paths:[test]},implementationRefs:[
 'scripts/build-epistemic-affinities-v1.mjs',test,'docs/governance/EPISTEMIC_AFFINITY_REVIEW.md'],
 respondentImpact:'Only a supported or opposed direct epistemic proposition can establish overlap or divergence. Quick and Standard retain their route-specific unmeasured doctrine; no identity or percentage is produced.',
 historicalCompatibility:'Model release 1.5 and its seven-entry catalog remain byte-for-byte pinned. No old answer, question wording, or historical affinity result is rewritten.',
 review:{approvals:[
  {role:'philosophical',reviewer:'Worldview Sorter AI editorial review',at:'2026-09-30T19:16:00Z',note:'Reviewed IEP Fallibilism and SEP Rationalism vs. Empiricism, scope, neighbors, and non-entailments.'},
  {role:'engineering',reviewer:'Worldview Sorter AI editorial review',at:'2026-09-30T19:16:00Z',note:'Checked exact existing item revisions, route opportunity, historical snapshots, and near-neighbor regression.'},
  {role:'linguistic',reviewer:'Worldview Sorter AI editorial review',at:'2026-09-30T19:16:00Z',note:'Canonical English only. Spanish and Arabic remain unavailable draft targets.'}
 ]}};
const proposals=[];
function add({objectType,changeClass='new_object',affectedObjects,proposition,sourceClaims,
 title,currentBehavior,proposedBehavior,rationale,neighboringViews,nonEntailments,existingGap,
 scholarlyDisagreement,components,alternatives}){
 const proposal={...shared,proposalId:'MCP-2026-'+String(29+proposals.length).padStart(3,'0'),title,
  objectType,changeClass,affectedObjects,currentBehavior,proposedBehavior,rationale,sourceClaims,alternatives,
  philosophicalBasis:{proposition,neighboringViews,nonEntailments,existingGap,scholarlyDisagreement},
  release:{targetVersion:'model-release-1.6.0',migration:'No data migration. Historical administrations resolve through their pinned 1.5 model, route, catalog, and engine source.',components}};
 validateProposal(proposal);proposals.push(proposal);
}
const grounds={
 'construct-EP15':{neighbors:['mere belief revision','skepticism','pragmatism','infallibilism'],
  nonEntailments:['Useful beliefs are automatically true','All possible beliefs are fallible'],
  gap:'The public direct rule had a scope but no exact proposition and rule-linked supporting claim for governed affinity use.',
  disagreement:'The scope and strength of fallibilism vary; this rule addresses only whether fallible justification can sometimes suffice for knowledge.'},
 'construct-EP20':{neighbors:['trust in science','a priori external-world knowledge','global empiricism'],
  nonEntailments:['Reasoning is unnecessary','All knowledge is sensory','Atheism or physicalism'],
  gap:'The public direct rule had sensory-source items but no exact proposition and rule-linked supporting claim for governed affinity use.',
  disagreement:'SEP treats empiricism as subject-relative and warns that historical thinkers need not fit a pure rationalist/empiricist type.'}
};
for(const [id,basis] of Object.entries(grounds)){
 const rule=model.commitments.find(row=>row.id===id);
 add({objectType:'proposition',changeClass:'semantic_clarification',affectedObjects:[{type:'proposition',id}],
  proposition:rule.proposition,sourceClaims:rule.sourceClaims,
  title:'Record exact sourced proposition for '+id,
  currentBehavior:'The same direct evidence was already interpreted, but the rule lacked an explicit source-linked proposition field.',
  proposedBehavior:'Keep the exact evidence and answer meanings while pinning the narrow proposition and supporting scholarly claim.',
  rationale:'Catalog mappings must consume a sourced, exact interpreted proposition rather than an associated construct name.',
  neighboringViews:basis.neighbors,nonEntailments:basis.nonEntailments,existingGap:basis.gap,
  scholarlyDisagreement:basis.disagreement,components:['model','pilot','full_form','progressive_routes'],
  alternatives:['Use the broad EP label as doctrine: rejected because it would hide the actual proposition.',
   'Write new questions: rejected because the existing three-item bundle already directly addresses this narrow claim.']});
}
for(const tradition of catalog.traditions.slice(-2)){
 const sourceClaims=tradition.sourceClaims;
 const common={sourceClaims,neighboringViews:tradition.neighbors,
  nonEntailments:tradition.nonEntailments,existingGap:'The reviewed candidate was absent from the public catalog despite a direct, route-tested proposition.',
  scholarlyDisagreement:tradition.sourceNotes,
  alternatives:['Infer a complete epistemological identity: rejected because the items cover only one subject-scoped doctrine.',
   'Map from adjacent scientific trust or generic revision items: rejected because those are near-neighbor false positives.']};
 add({...common,objectType:'tradition',affectedObjects:[{type:'tradition',id:tradition.id}],
  proposition:tradition.commitments.find(c=>c.role==='defining').doctrine,
  title:'Add scoped comparison '+tradition.name,
  currentBehavior:'The catalog showed no separate comparison for this narrow epistemic position.',
  proposedBehavior:'The catalog compares the exact defining proposition and displays characteristic, disputed, and unmeasured doctrine.',
  rationale:'This is a sourced doctrinal comparison over a public interpreted proposition, not an identity assignment.',
  components:['affinity']});
 for(const criterion of tradition.commitments){
  add({...common,objectType:'criterion',affectedObjects:[{type:'criterion',id:tradition.id+'/'+criterion.id}],
   proposition:criterion.doctrine,sourceClaims:criterion.sourceClaims,
   title:'Review '+tradition.id+' / '+criterion.id,
   currentBehavior:'This doctrinal criterion was absent from the historical seven-entry catalog.',
   proposedBehavior:criterion.mapping.status==='direct'?'Use the exact public direct proposition as defining evidence.':
    'Record this nonessential doctrinal area as unmeasured; it cannot add overlap.',
   rationale:'Separate defining doctrine from historically associated or disputed views and keep missing criteria visible.',
   components:['affinity']});
 }
}
const sourceIds=['iep-fallibilism','sep-rationalism-empiricism'];
const allClaims=sourceIds.map(id=>model.commitments.find(rule=>rule.sourceIds.includes(id)).sourceClaims[0]);
const broad={proposition:'Two narrow epistemic comparisons use claim-level academic sources and existing direct items.',
 sourceClaims:allClaims,neighboringViews:['generic belief revision','scientific trust','full historical empiricism'],
 nonEntailments:['Empirical validation of the original questions','A complete epistemological identity'],
 existingGap:'The specific fallibilism and rationalism/empiricism sources were only in a review backlog, not the production claim ledger.',
 scholarlyDisagreement:'Both sources distinguish narrow theses and discuss variations; no one doctrine is universalized across subject areas.',
 alternatives:['Rely on a generic bibliography: rejected because rule and criterion claims need traceable source IDs.',
  'Use citation count as evidence strength: rejected because source relevance is claim-specific.']};
add({...broad,objectType:'source',affectedObjects:sourceIds.map(id=>({type:'source',id})),
 title:'Promote two claim-specific academic source records',
 currentBehavior:'The reviewed source use was not linked from active rule and catalog claims.',
 proposedBehavior:'Registry, ledger, model, and catalog pin the two exact source claims and their limited use.',
 rationale:'The source-to-claim chain must be inspectable for every new comparison.',
 components:['sources','source_ledger','model','affinity']});
add({...broad,objectType:'route',changeClass:'semantic_clarification',
 affectedObjects:['quick','standard','full','route-policy'].map(id=>({type:'route',id})),
 title:'Rebind unchanged routes to the sourced comparison release',
 currentBehavior:'The 64/120/240 routes used catalog 1.3 and model 1.3.',
 proposedBehavior:'Keep exact item revisions and order while pinning model 1.4 and catalog 1.4. Quick still omits both defining bundles; Standard offers only fallibilism; Full offers both.',
 rationale:'A new catalog must not be silently substituted into a historical route definition.',
 components:['progressive_routes','full_form','pilot']});
add({...broad,objectType:'localization',changeClass:'semantic_clarification',
 affectedObjects:['bundle/ar','bundle/en-US','bundle/es-ES','catalog/ar','catalog/en-US','catalog/es-ES','catalog/model-binding'].map(id=>({type:'localization',id})),
 title:'Pin canonical and draft localization to catalog 1.4',
 currentBehavior:'Localization metadata referred to model and catalog 1.3.',
 proposedBehavior:'Canonical English pins the new source definitions. Spanish and Arabic remain unavailable and explicitly require review of the new comparisons.',
 rationale:'New doctrine must not make stale translations silently eligible.',components:['localization_catalog']});
add({...broad,objectType:'result_semantics',changeClass:'semantic_clarification',
 affectedObjects:[{type:'result_semantics',id:'affinity-catalog-policy'},
  {type:'result_semantics',id:'engine-source'}],
 title:'Pin the new catalog binding and replay executable source',
 currentBehavior:'Historical results used seven comparisons and the 1.3 client archive.',
 proposedBehavior:'New administrations use nine scoped comparisons under archive 1.4; prior seven-entry results retain their original catalog and executable source.',
 rationale:'An affinity release and client-version change must be replayable independently from historical results.',
 components:['affinity','engine_source']});
for(const proposal of proposals){const file=path.join(root,'data/governance/proposals',proposal.proposalId+'.json');
 await writeFile(file,JSON.stringify(proposal,null,2)+'\n');}
console.log('Generated '+proposals.length+' reviewed proposal records, '+proposals[0].proposalId+' through '+proposals.at(-1).proposalId);
