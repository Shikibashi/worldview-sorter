import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const currentAudit=process.argv.includes('--current');
const activeAudit=process.argv.includes('--active');
const active=activeAudit?JSON.parse(await readFile(new URL('data/current.json',root),'utf8')):null;
const paths={bank:activeAudit?active.candidateBank.path:'data/items/candidate-v0.9.json',
 model:activeAudit?active.worldviewModel.path:currentAudit?'data/generic/model-v1.2-pilot.json':'data/generic/model-v1.1-pilot.json',
 routes:activeAudit?active.progressiveDepth.path:currentAudit?'data/experience/progressive-depth-v1.2.json':'data/experience/progressive-depth-v1.1.json',historicalGaps:'data/reviews/route-review-v1.json',
 directionalDecisions:'data/reviews/directional-contract-decisions-v1.json'};
const raw=async path=>readFile(new URL(path,root));
const read=async path=>JSON.parse(await raw(path));
const [bank,model,policy,prior,decisionFile]=await Promise.all(Object.values(paths).map(read));
assert.equal(model.modelVersion,activeAudit?active.worldviewModel.version:currentAudit?'generic-1.2.0-pilot':'generic-1.1.0-pilot');
assert.equal(policy.policyVersion,activeAudit?active.progressiveDepth.version:currentAudit?'progressive-depth-1.2.0':'progressive-depth-1.1.0');
assert.equal(decisionFile.schemaVersion,'directional-contract-decisions-1');
// The successor changes claim provenance and affinity mapping, not rule evidence.
assert.equal(decisionFile.modelVersion,'generic-1.1.0-pilot');
const decisions=new Map(decisionFile.decisions.map(row=>[row.ruleId,row]));
assert.equal(decisions.size,decisionFile.decisions.length,'Repeated directional decision.');
const full=policy.routes.find(route=>route.id==='full');
assert.ok(full&&full.size===(activeAudit?240:238));
const bankItems=new Map(bank.items.map(item=>[item.id,item]));
const fullRefs=new Map(full.itemRefs.map(ref=>[ref.itemId,ref.itemRevision]));
const rules=new Map(model.commitments.map(rule=>[rule.id,rule]));
const publicIds=new Set(model.publicRuleIds);
assert.equal(fullRefs.size,full.itemRefs.length,'Repeated Full-route item.');
for(const [id,revision] of fullRefs)assert.equal(bankItems.get(id)?.revision,revision,'Stale Full-route item: '+id);
const counts=(rule,refs)=>Object.fromEntries(['support','oppose'].map(direction=>
 [direction,new Set(rule.evidence.filter(e=>refs.has(e.itemId)&&e[direction].length).map(e=>e.unitId)).size]));
const enough=(rule,opportunity)=>opportunity.support>=rule.minimumEvidenceUnits&&opportunity.oppose>=rule.minimumEvidenceUnits;
const wholeBank=new Map([...bankItems].map(([id,item])=>[id,item.revision]));
const directionalContracts=model.commitments.flatMap(rule=>{
 const available=counts(rule,wholeBank);
 if(enough(rule,available))return [];
 return [{ruleId:rule.id,constructId:rule.constructId,domainId:rule.domainId,label:rule.label,
  public:publicIds.has(rule.id),minimumEvidenceUnits:rule.minimumEvidenceUnits,bankEvidenceUnits:available,
  missingDirections:['support','oppose'].filter(direction=>available[direction]<rule.minimumEvidenceUnits),
  disposition:publicIds.has(rule.id)?'public_rule_structurally_not_measured':'nonpublic_rule_structurally_not_measured',
  semanticReview:decisions.get(rule.id)??null,
  reviewRequirement:'A versioned item or rule review must supply the missing direction or explicitly change the inference contract before this rule can produce a directional public result.'}];
});
const directionalIds=directionalContracts.map(row=>row.ruleId).sort();
assert.deepEqual([...decisions.keys()].sort(),directionalIds,'Every directional gap needs an exact-item semantic disposition.');
for(const decision of decisions.values())assert.ok(decision.cause&&decision.reason&&decision.nextReview&&
 Array.isArray(decision.academicContextUrls)&&decision.academicContextUrls.every(url=>url.startsWith('https://')),
 'Incomplete directional semantic review: '+decision.ruleId);
const fullRouteGaps=model.commitments.filter(rule=>publicIds.has(rule.id)).flatMap(rule=>{
 const available=counts(rule,fullRefs);
 if(enough(rule,available))return [];
 const bankAvailable=counts(rule,wholeBank);
 const gapClass=!enough(rule,bankAvailable)?'bank_directional_contract_gap':
  available.support===0&&available.oppose===0?'all_evidence_omitted_by_frozen_route':'incomplete_frozen_route_path';
 return [{ruleId:rule.id,constructId:rule.constructId,domainId:rule.domainId,label:rule.label,tier:rule.tier,
  minimumEvidenceUnits:rule.minimumEvidenceUnits,fullRouteEvidenceUnits:available,bankEvidenceUnits:bankAvailable,
  assignedEvidenceItemRefs:rule.evidence.filter(e=>fullRefs.has(e.itemId)).map(e=>({itemId:e.itemId,itemRevision:e.itemRevision,unitId:e.unitId})),
  outsideRouteEvidenceItemRefs:rule.evidence.filter(e=>!fullRefs.has(e.itemId)).map(e=>({itemId:e.itemId,itemRevision:e.itemRevision,unitId:e.unitId})),
  sourceIds:rule.sourceIds,gapClass,disposition:'retain_not_measured',
  futureChange:gapClass==='bank_directional_contract_gap'?'versioned_item_or_rule_review':
   'successor_route_review_only_if_incremental_distinction_justifies_burden',
  historicalCompatibility:'The frozen 238-item route and prior result are unchanged.'}];
});
const historicalRouteGaps=prior.structuralGaps.map(gap=>{
 const coverage=model.coverage.constructs.find(row=>row.id===gap.constructId);
 assert.ok(coverage,'Historical construct disappeared: '+gap.constructId);
 const successorRules=(coverage.ruleIds??[]).map(id=>rules.get(id)).filter(Boolean);
 const publicSuccessors=successorRules.filter(rule=>publicIds.has(rule.id));
 const matching=publicSuccessors.filter(rule=>rule.id===gap.ruleId.replace(/^audit-/,'audit2-'));
 const status=gap.constructId==='SO09'?'reopened_and_unresolved':matching.length?'related_public_rule_with_full_path':
  publicSuccessors.length?'narrower_or_split_public_rule_with_full_path':successorRules.length?'successor_rule_nonpublic':'no_successor_direct_rule';
 for(const rule of publicSuccessors)assert.ok(enough(rule,counts(rule,fullRefs)),'Unresolved prior path: '+rule.id);
 return {historicalRuleId:gap.ruleId,constructId:gap.constructId,currentConstructDisposition:coverage.disposition??null,
  currentRuleIds:successorRules.map(rule=>rule.id),currentPublicRuleIds:publicSuccessors.map(rule=>rule.id),status,
  inferenceBoundary:status==='related_public_rule_with_full_path'?'The successor rule has a route path; the historic and successor propositions still require version-specific reading.':
   'No inference from the historical rule transfers automatically to a successor target.',
  historicalCompatibility:'The 80/120/160/240 releases and the historical gap record remain unchanged.'};
});
const statusCounts=Object.fromEntries([...new Set(historicalRouteGaps.map(row=>row.status))].sort().map(status=>
 [status,historicalRouteGaps.filter(row=>row.status===status).length]));
const gapClassCounts=Object.fromEntries([...new Set(fullRouteGaps.map(row=>row.gapClass))].sort().map(gapClass=>
 [gapClass,fullRouteGaps.filter(row=>row.gapClass===gapClass).length]));
const fullGapIds=new Set(fullRouteGaps.map(row=>row.ruleId));
const fullRouteScope={
 intendedAssessablePublicRuleIds:[...publicIds].filter(id=>!fullGapIds.has(id)).sort(),
 conditionallyAssessablePublicRuleIds:[],
 deliberatelyUnmeasuredPublicRuleIds:fullRouteGaps.map(row=>row.ruleId).sort(),
 researchOnlyRuleIds:model.researchOnlyRuleIds.toSorted(),
 constructsWithoutDirectRuleIds:model.coverage.constructs.filter(row=>!(row.ruleIds??[]).length)
  .map(row=>row.id).sort(),
 unresolvedOrNeedsItemsConstructIds:model.coverage.constructs.filter(row=>!(row.ruleIds??[]).length&&
  ['unresolved','requires_new_discriminating_items'].includes(row.disposition)).map(row=>row.id).sort(),
 note:'This is the frozen route opportunity contract, not a claim that any respondent reached a directional result.'};
const report={schemaVersion:'pilot-evidence-dispositions-1',auditVersion:activeAudit?'pilot-evidence-dispositions-1.3.0':currentAudit?'pilot-evidence-dispositions-1.1.0':'pilot-evidence-dispositions-1.0.0',
 scope:'Authored evidence-path and compatibility audit of the frozen successor pilot. Counts are structural, not psychometric.',
 inputs:Object.fromEntries(await Promise.all(Object.values(paths).map(async path=>[path,createHash('sha256').update(await raw(path)).digest('hex')]))),
 release:{modelVersion:model.modelVersion,routePolicyVersion:policy.policyVersion,fullRouteVersion:full.routeVersion,
  bankVersion:bank.bankVersion},
 summary:{bankItems:bank.items.length,publicRules:publicIds.size,fullRouteItems:fullRefs.size,
  fullRouteAssessableRules:publicIds.size-fullRouteGaps.length,fullRouteNotMeasuredRules:fullRouteGaps.length,
  wholeBankDirectionalGaps:directionalContracts.length,publicWholeBankDirectionalGaps:directionalContracts.filter(row=>row.public).length,
  historicalRouteGaps:historicalRouteGaps.length,historicalStatusCounts:statusCounts,fullRouteGapClasses:gapClassCounts},
 semantics:{assessable:'The route assigns at least the authored minimum distinct units in both directions; actual responses may remain inconclusive.',
  notMeasured:'The frozen route lacks a viable two-direction authored path; a response to one mapped item is not a public conclusion.',
  noStatisticalClaim:'Evidence-unit IDs control authored duplication only. They do not establish independent items, reliability, or human validity.'},
 directionalContracts,fullRouteScope,fullRouteGaps,historicalRouteGaps};
assert.deepEqual(report.summary,{bankItems:activeAudit?564:562,publicRules:activeAudit?141:140,fullRouteItems:activeAudit?240:238,fullRouteAssessableRules:activeAudit?91:90,
 fullRouteNotMeasuredRules:50,wholeBankDirectionalGaps:16,publicWholeBankDirectionalGaps:11,historicalRouteGaps:35,
 historicalStatusCounts:{no_successor_direct_rule:16,narrower_or_split_public_rule_with_full_path:2,
  related_public_rule_with_full_path:14,reopened_and_unresolved:1,successor_rule_nonpublic:2},
 fullRouteGapClasses:{all_evidence_omitted_by_frozen_route:37,bank_directional_contract_gap:11,incomplete_frozen_route_path:2}});
const artifact=activeAudit?'data/reviews/pilot-evidence-dispositions-v4.json':currentAudit?'data/reviews/pilot-evidence-dispositions-v2.json':'data/reviews/pilot-evidence-dispositions-v1.json',bytes=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--write'))await writeFile(new URL(artifact,root),bytes);
else if(process.argv.includes('--check'))assert.equal((await raw(artifact)).toString(),bytes,'Pilot evidence disposition artifact is stale.');
else process.stdout.write(JSON.stringify(report.summary,null,2)+'\n');
