// Proposal records for a small, reviewed successor release. Historical proposals are untouched.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateProposal} from '../packages/governance/index.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const model=await read('data/generic/model-v1.5-pilot.json');
const rule=model.commitments.find(row=>row.id==='reviewed-NE22-act-consequence-criterion');
if(!rule)throw Error('Release rule missing.');
const sourceClaims=rule.sourceClaims;
const required=['positive','negative','mixed','missing','false_positive_neighbor','historical'];
const shared={schemaVersion:'model-change-proposal-1',author:'Worldview Sorter AI editorial review',
 status:'approved',tests:{required,paths:['scripts/test-act-consequence-content-release.mjs']},
 implementationRefs:['scripts/build-act-consequence-content-v1.mjs',
  'scripts/test-act-consequence-content-release.mjs','docs/governance/ACT_CONSEQUENCE_REVIEW.md'],
 respondentImpact:'Only Full adds this scoped, direct act-consequence proposition. A single directional answer is a lean; Quick and Standard retain not_measured. The nine doctrinal comparisons gain no automatic affinity criterion.',
 historicalCompatibility:'Release 1.6.0, its 240-item Full route, nine-entry catalog, and older item revisions remain pinned. Old administrations retain their original model and executable source.',
 review:{approvals:[
  {role:'philosophical',reviewer:'Worldview Sorter AI editorial review',at:'2026-09-30T19:51:00Z',
   note:'Reviewed SEP Consequentialism and SEP Rule Consequentialism; delimited act criterion, maximization, rule-based neighbor, and non-entailments.'},
  {role:'engineering',reviewer:'Worldview Sorter AI editorial review',at:'2026-09-30T19:51:00Z',
   note:'Checked exact item revisions, answer meanings, route opportunity, mixed and missing states, historical replay, and false-positive fixtures.'},
  {role:'linguistic',reviewer:'Worldview Sorter AI editorial review',at:'2026-09-30T19:51:00Z',
   note:'Only canonical English is active; Spanish and Arabic are marked as requiring translation and philosophical review.'}
 ]}};
const basis={proposition:rule.proposition,neighboringViews:rule.neighbors,
 nonEntailments:rule.nonEntailments,
 existingGap:'The prior bank asked about consequences and generic rule priority, but did not directly distinguish an act-rightness criterion from a consequence-justified rule while checking maximization.',
 scholarlyDisagreement:'Consequentialists differ over act versus rule formulations, what counts as good, maximization versus satisficing, and whether the criterion of rightness is a decision procedure.'};
const alternatives=[
 'Infer utilitarianism from generic outcome concern: rejected because the items do not establish welfare maximization or aggregation.',
 'Reuse the existing maximization item alone: rejected because it cannot distinguish direct act assessment from a rule or another principle that rejects dominated acts.',
 'Add a full utilitarian question bundle: deferred because this release needs only the narrow direct criterion.'
];
const proposals=[];
function add({objectType,changeClass='new_object',affectedObjects,title,currentBehavior,proposedBehavior,
 rationale,components,philosophicalBasis=basis,claims=sourceClaims}){
 const proposal={...shared,proposalId:'MCP-2026-'+String(43+proposals.length).padStart(3,'0'),
  title,objectType,changeClass,affectedObjects,currentBehavior,proposedBehavior,rationale,
  alternatives,sourceClaims:claims,philosophicalBasis,
  release:{targetVersion:'model-release-1.7.0',
   migration:'No data migration. Previously saved administrations retain their pinned release, route, model, catalog, and engine archive.',components}};
 validateProposal(proposal);proposals.push(proposal);
}
const affected=(type,...ids)=>ids.map(id=>({type,id}));
add({objectType:'item',affectedObjects:affected('item','NEI122'),
 title:'Add a direct act-versus-rule rightness question',
 currentBehavior:'The bank had no released item asking whether the act itself or a consequence-justified rule ultimately determines rightness in this case.',
 proposedBehavior:'NEI122@1 presents act-outcome, rule-outcome, independent-duty, and contextual answers; neutral and missing answers stay non-directional.',
 rationale:'One reviewed direct discriminator is necessary alongside the existing NEI014@1 maximization check.',
 components:['bank','pilot','full_form','content_review','progressive_routes']});
add({objectType:'construct',affectedObjects:affected('construct','NE22'),
 title:'Register a scoped act-consequence construct',
 currentBehavior:'Generic consequence concern and rule priority were represented, but their labels could not carry a narrow direct act criterion.',
 proposedBehavior:'NE22 records an authored, provisional categorical distinction without a validated factor claim.',
 rationale:'A separate theoretical target prevents a rule for generic outcome concern from being mistaken for this criterion.',
 components:['registry','model','pilot','full_form']});
add({objectType:'proposition',affectedObjects:affected('proposition',rule.id),
 title:'Interpret the two-unit direct act-consequence proposition',
 currentBehavior:'No direct act-consequence proposition was available to public results.',
 proposedBehavior:'NEI122@1 and NEI014@1 must concur for directional support or opposition; one unit gives only a lean, conflict is mixed, and omitted routes are not measured.',
 rationale:'The two questions separate criterion of rightness from generic consequence sensitivity and test the maximizing implication.',
 components:['model','pilot','full_form','progressive_routes']});
add({objectType:'research_classification',changeClass:'reclassification',
 affectedObjects:affected('research_classification',rule.id),
 title:'Approve only the scoped NE22 proposition for public interpretation',
 currentBehavior:'The new proposition was absent from historical public rule lists.',
 proposedBehavior:'The reviewed direct proposition is public on a route with a two-direction evidence opportunity; no full tradition or welfare theory is promoted.',
 rationale:'Public membership follows exact proposition and source review with mixed, missing, and neighboring-view regressions.',
 components:['model','pilot','full_form','progressive_routes']});
add({objectType:'source',affectedObjects:affected('source','sep-act-consequence-criterion'),
 title:'Pin the act and rule consequentialism source claim',
 currentBehavior:'The release had no claim-specific academic source for a direct act criterion.',
 proposedBehavior:'The source registry, ledger, and rule attach the SEP Consequentialism claim to the limited conceptual distinction.',
 rationale:'A claim-to-rule chain is required without implying that the source validates authored items.',
 components:['sources','source_ledger','model']});
add({objectType:'route',changeClass:'substantive_revision',
 affectedObjects:affected('route','quick','standard','full','route-policy'),
 title:'Pin 64/120/242 routes and their evidence opportunity',
 currentBehavior:'Quick, Standard, and Full contained 64/120/240 questions under route policy 1.4.',
 proposedBehavior:'Quick and Standard keep identical ordered item revisions; Full adds NEI014@1 and NEI122@1 as separate frames and makes NE22 assessable.',
 rationale:'The added content earns its Full-route burden through a distinct direct philosophical criterion, while historical route definitions remain immutable.',
 components:['progressive_routes','full_form','pilot','content_review']});
add({objectType:'localization',changeClass:'semantic_clarification',
 affectedObjects:affected('localization','bundle/ar','bundle/en-US','bundle/es-ES',
  'catalog/ar','catalog/en-US','catalog/es-ES','catalog/model-binding'),
 title:'Pin localization review state to the new bank and model',
 currentBehavior:'Localization bundles were bound to the previous model and 564-item bank.',
 proposedBehavior:'Canonical English uses the new model; Spanish and Arabic remain unavailable pending translation and philosophical review of NEI122 and NE22.',
 rationale:'The new philosophical distinction must not inherit presumed translation equivalence.',
 components:['localization_catalog']});
add({objectType:'result_semantics',changeClass:'semantic_clarification',
 affectedObjects:affected('result_semantics','model-policy','affinity-catalog-policy','engine-source'),
 title:'Pin public rule membership, unchanged affinity mapping, and executable source',
 currentBehavior:'Historical release 1.6 had 141 public direct rules, nine comparisons, and engine source 1.4.',
 proposedBehavior:'Release 1.7 adds only NE22 to public direct rules, rebinds the unchanged nine comparisons, and archives engine source 1.5 for replay.',
 rationale:'The catalog must not silently turn the new proposition into ideology identity; rule and executable changes must be versioned.',
 components:['model','affinity','engine_source']});
for(const proposal of proposals){await writeFile(path.join(root,'data/governance/proposals',proposal.proposalId+'.json'),
 JSON.stringify(proposal,null,2)+'\n');}
console.log('Generated '+proposals.length+' governed proposals for model-release-1.7.0.');
