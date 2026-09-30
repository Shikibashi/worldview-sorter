import {readFile,writeFile} from 'node:fs/promises';
import {validateProposal} from '../packages/governance/index.js';

const root=new URL('../',import.meta.url);
const model=JSON.parse(await readFile(new URL('data/generic/model-v1.7-pilot.json',root)));
const rule=model.commitments.find(row=>row.id==='reviewed-ME06-literal-truth-claim');
const sourceClaims=rule.sourceClaims;
const now='2026-09-30T22:00:00Z',target='model-release-1.10.0';
const basis={proposition:rule.proposition,
 neighboringViews:['moral error theory','cognitivist relativism','expressivism','quasi-realism','moral realism'],
 nonEntailments:['Truth-aptness does not imply that any moral claim is true.',
  'No complete metaethical school or psychometric type follows from this rule.'],
 existingGap:'Full already asks two direct semantic questions, but the public model did not expose a separately source-linked exact proposition.',
 scholarlyDisagreement:'Sophisticated expressivists and minimalists dispute whether ordinary truth-talk establishes robust cognitivist semantics.'};
const common={schemaVersion:'model-change-proposal-1',author:'Worldview Sorter AI editorial review',status:'approved',
 currentBehavior:'The two Full-route answers are available only to a diagnostic legacy truth-aptness rule without an exact public proposition.',
 proposedBehavior:'Expose only a literal moral truth-claim proposition from two directional units; retain other metaethical and affinity gaps.',
 rationale:'The existing items directly address the semantic proposition. A stronger realism or school inference would be a false positive.',
 philosophicalBasis:basis,sourceClaims,
 alternatives:['Infer moral realism: rejected because actual moral truth remains unmeasured.',
  'Count attitude expression as opposition: rejected because hybrid and cognitivist subjectivist accounts can also express attitudes.',
  'Add a paraphrase question: rejected because the two existing Full items already supply different response formats.'],
 respondentImpact:'Full may now show a narrow supported, opposed, mixed, leaned, or insufficient truth-claim result; Quick and Standard remain not measured. No affinity or raw answer changes.',
 historicalCompatibility:'Release 1.9.0 and prior model, route, source, localization, and result artifacts remain at immutable paths. The same 64/120/243 item revisions and order are retained.',
 tests:{required:['positive','negative','mixed','missing','false_positive_neighbor','historical'],
  paths:['scripts/test-moral-truth-claim-release.mjs']},
 review:{approvals:[
  {role:'philosophical',reviewer:'Worldview Sorter AI editorial review',at:now,
   note:'Reviewed SEP moral cognitivism and moral realism distinctions, including error theory, relativism, hybrid expression, and minimalist truth.'},
  {role:'engineering',reviewer:'Worldview Sorter AI editorial review',at:now,
   note:'Reviewed exact MEI017@1 and MEI018@1 directions, route opportunity, false positives, and frozen replay.'},
  {role:'linguistic',reviewer:'Worldview Sorter AI editorial review',at:now,
   note:'Canonical English wording is unchanged; Spanish and Arabic remain unavailable pending philosophical translation review.'}]},
 implementationRefs:['scripts/build-moral-truth-claim-v1.mjs','scripts/test-moral-truth-claim-release.mjs',
  'docs/governance/MORAL_TRUTH_CLAIM_REVIEW.md']};
const specs=[
 ['070','Approve exact literal moral truth-claim proposition','proposition','new_object',
  [{type:'proposition',id:rule.id}],['model']],
 ['071','Promote narrow truth-claim rule to public interpretation','research_classification','reclassification',
  [{type:'research_classification',id:rule.id}],['model']],
 ['072','Pin supporting SEP claim to proposition and source ledgers','source','new_object',
  [{type:'source',id:sourceClaims[0].sourceId}],['model','sources','source_ledger']],
 ['073','Bind unchanged Full evidence path and shorter-route omissions','route','semantic_clarification',
  ['quick','standard','full','route-policy'].map(id=>({type:'route',id})),
  ['progressive_routes','full_form','pilot']],
 ['074','Version locale bindings for the new public proposition','localization','semantic_clarification',
  [{type:'localization',id:'catalog/model-binding'},...['en-US','es-ES','ar'].flatMap(locale=>[
   {type:'localization',id:'catalog/'+locale},{type:'localization',id:'bundle/'+locale}])],
  ['localization_catalog']],
 ['075','Rebind catalog and model result policies without new affinity','result_semantics','semantic_clarification',
  [{type:'result_semantics',id:'affinity-catalog-policy'},
   {type:'result_semantics',id:'model-policy'}],['affinity','model']]
];
for(const [num,title,objectType,changeClass,affectedObjects,components] of specs){
 const proposal={...common,proposalId:'MCP-2026-'+num,title,objectType,changeClass,affectedObjects,
  release:{targetVersion:target,
   migration:'No raw response rewrite; historical administrations retain their pinned model release.',components}};
 validateProposal(proposal);
 await writeFile(new URL('data/governance/proposals/'+proposal.proposalId+'.json',root),
  JSON.stringify(proposal,null,2)+'\n',{flag:'wx'});
}
console.log('Approved '+specs.length+' proposition, classification, source, route, locale, and result-policy proposals.');
