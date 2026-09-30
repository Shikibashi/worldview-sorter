// Release-scoped editorial records for a direct rule-consequence criterion.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateProposal} from '../packages/governance/index.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const model=JSON.parse(await readFile(path.join(root,'data/generic/model-v1.6-pilot.json'),'utf8'));
const rule=model.commitments.find(row=>row.id==='reviewed-NE23-rule-consequence-criterion');
if(!rule)throw Error('Release rule missing.');
const required=['positive','negative','mixed','missing','false_positive_neighbor','historical'];
const sourceClaims=rule.sourceClaims;
const shared={schemaVersion:'model-change-proposal-1',author:'Worldview Sorter AI editorial review',
 status:'approved',tests:{required,paths:['scripts/test-rule-consequence-content-release.mjs']},
 implementationRefs:['scripts/build-rule-consequence-content-v1.mjs',
  'scripts/test-rule-consequence-content-release.mjs','docs/governance/RULE_CONSEQUENCE_REVIEW.md'],
 respondentImpact:'Only Full adds this two-unit direct rule-consequence criterion. One directional answer is a lean; Quick and Standard retain not_measured. The nine doctrinal comparisons gain no automatic criterion.',
 historicalCompatibility:'Release 1.7.0, its 242-item Full route, nine-entry catalog, and older item revisions remain pinned. Saved administrations retain their original model and executable source.',
 review:{approvals:[
  {role:'philosophical',reviewer:'Worldview Sorter AI editorial review',at:'2026-09-30T20:25:00Z',
   note:'Reviewed SEP Rule Consequentialism sections 4 and 8, including the criterion versus decision-procedure distinction and act, duty, and contractualist neighbors.'},
  {role:'engineering',reviewer:'Worldview Sorter AI editorial review',at:'2026-09-30T20:25:00Z',
   note:'Checked exact item revisions, directional and non-directional answers, route opportunity, false-positive fixtures, and historical preservation.'},
  {role:'linguistic',reviewer:'Worldview Sorter AI editorial review',at:'2026-09-30T20:25:00Z',
   note:'Only canonical English is active; Spanish and Arabic remain unavailable pending translation and philosophical review.'}
 ]}};
const basis={proposition:rule.proposition,neighboringViews:rule.neighbors,nonEntailments:rule.nonEntailments,
 existingGap:'The prior bank asked whether a consequence-justified rule governs one act, but lacked an independent question about the rule’s ultimate justification.',
 scholarlyDisagreement:'Full and partial rule consequentialism differ on criterion versus decision procedure; theories differ further about rule selection, exceptions, and moral sanctions.'};
const alternatives=[
 'Treat generic rule guidance as rule consequentialism: rejected because act consequentialists can use rules as a decision procedure.',
 'Treat generic concern for outcomes as rule consequentialism: rejected because it never establishes the rule as a rightness criterion.',
 'Promote a complete ethical identity: deferred because sanctions, value theory, and acceptance conditions are not measured.'
];
const proposals=[];
function add({objectType,changeClass='new_object',affectedObjects,title,currentBehavior,proposedBehavior,
 rationale,components}){
 const proposal={...shared,proposalId:'MCP-2026-'+String(51+proposals.length).padStart(3,'0'),
  title,objectType,changeClass,affectedObjects,currentBehavior,proposedBehavior,rationale,
  alternatives,sourceClaims,philosophicalBasis:basis,
  release:{targetVersion:'model-release-1.8.0',
   migration:'No data migration. Historical administrations remain pinned to their release, route, model, catalog, and engine archive.',components}};
 validateProposal(proposal);proposals.push(proposal);
}
const affected=(type,...ids)=>ids.map(id=>({type,id}));
add({objectType:'item',affectedObjects:affected('item','NEI123'),
 title:'Add an ultimate rule-justification question',
 currentBehavior:'No released item independently asked what ultimately justifies a rule against harming an innocent person.',
 proposedBehavior:'NEI123@1 offers general-consequence, independent-person-claim, reasonable-agreement, and plural answers; only the first and second are directional for the narrow new rule.',
 rationale:'NEI122@1 already asks which criterion governs an act; a separate question about the rule’s justification is necessary to exclude useful-rule and deontological false positives.',
 components:['bank','pilot','full_form','content_review','progressive_routes']});
add({objectType:'construct',affectedObjects:affected('construct','NE23'),
 title:'Register a consequence-justified rule criterion',
 currentBehavior:'The registry had generic rule priority and a direct act-consequence criterion, but no distinct construct for consequence-justified rule rightness.',
 proposedBehavior:'NE23 records a provisional categorical philosophical target without implying a validated factor or a complete tradition.',
 rationale:'A separate target prevents a useful rule of thumb or independent duty from being mislabeled as this criterion.',
 components:['registry','model','pilot','full_form']});
add({objectType:'proposition',affectedObjects:affected('proposition',rule.id),
 title:'Interpret the direct consequence-justified rule criterion',
 currentBehavior:'No public direct rule required both consequence-based rule justification and rule-governed act rightness.',
 proposedBehavior:'NEI122@1 and NEI123@1 must concur for support or opposition; conflict is mixed, one directional unit leans, and omitted routes are not measured.',
 rationale:'Two differently framed questions jointly test the exact criterion and guard against act consequentialism, generic rule guidance, and independent duty.',
 components:['model','pilot','full_form','progressive_routes']});
add({objectType:'research_classification',changeClass:'reclassification',
 affectedObjects:affected('research_classification',rule.id),
 title:'Approve only the scoped NE23 proposition for public interpretation',
 currentBehavior:'Historical public rule lists did not contain NE23.',
 proposedBehavior:'The reviewed rule becomes public only where both assigned items permit directional evidence; no affinity identity is inferred.',
 rationale:'Membership follows exact proposition and source review with mixed, missing, and neighboring-view regressions.',
 components:['model','pilot','full_form','progressive_routes']});
add({objectType:'source',affectedObjects:affected('source','sep-rule-consequence-criterion'),
 title:'Pin the rule-consequence source claim',
 currentBehavior:'No rule-linked academic claim established the proposed criterion versus decision-procedure contrast.',
 proposedBehavior:'The source registry, claim ledger, and new rule attach the SEP Rule Consequentialism claim to the limited proposition.',
 rationale:'A traceable source-to-rule claim is required without pretending the source validates the authored questions.',
 components:['sources','source_ledger','model']});
add({objectType:'route',changeClass:'substantive_revision',
 affectedObjects:affected('route','quick','standard','full','route-policy'),
 title:'Pin 64/120/243 routes and their evidence opportunity',
 currentBehavior:'Quick, Standard, and Full contained 64/120/242 questions under policy 1.5.',
 proposedBehavior:'Quick and Standard keep identical ordered items; Full adds NEI123@1 away from its related question and makes NE23 assessable.',
 rationale:'The added content supplies a missing discriminator while historical route definitions remain immutable.',
 components:['progressive_routes','full_form','pilot','content_review']});
add({objectType:'localization',changeClass:'semantic_clarification',
 affectedObjects:affected('localization','bundle/ar','bundle/en-US','bundle/es-ES',
  'catalog/ar','catalog/en-US','catalog/es-ES','catalog/model-binding'),
 title:'Pin localization review state to the new bank and model',
 currentBehavior:'Localization bundles were bound to the 565-item bank and model 1.5.',
 proposedBehavior:'Canonical English uses the successor model; Spanish and Arabic remain unavailable pending review of NEI123 and NE23.',
 rationale:'A new philosophical distinction must not inherit presumed translation equivalence.',
 components:['localization_catalog']});
add({objectType:'result_semantics',changeClass:'semantic_clarification',
 affectedObjects:affected('result_semantics','model-policy','affinity-catalog-policy','engine-source'),
 title:'Pin public rule membership, unchanged affinity mapping, and executable source',
 currentBehavior:'Release 1.7 had 142 public direct rules, nine comparisons, and engine source 1.5.',
 proposedBehavior:'Release 1.8 adds only NE23 to public direct rules, rebinds the unchanged nine comparisons, and archives engine source 1.6.',
 rationale:'The catalog must not silently turn the new proposition into identity; executable and result semantics remain pinned.',
 components:['model','affinity','engine_source']});
for(const proposal of proposals)await writeFile(path.join(root,'data/governance/proposals',proposal.proposalId+'.json'),
 JSON.stringify(proposal,null,2)+'\n');
console.log('Generated '+proposals.length+' governed proposals for model-release-1.8.0.');
