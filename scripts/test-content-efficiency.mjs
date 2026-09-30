import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// This tests the immutable PR #1 audit baseline, not an empirical claim about
// response quality or all possible packet seeds.
execFileSync(process.execPath,[new URL('./audit-content-efficiency.mjs',import.meta.url).pathname,'--check'],{stdio:'pipe'});
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const audit=read('data/reviews/content-efficiency-v1.json');
const review=read('data/reviews/route-review-v1.json');
const bank=read('data/items/candidate-v0.9.json');
const model=read('data/generic/model-v0.3.json');
const prior=read('data/academic/unmapped-audit-v1.json');
const ruleById=new Map(model.commitments.map(rule=>[rule.id,rule]));
const allowed=new Set(['keep','keep_parallel_indicator','keep_discriminator','keep_research_only','rewrite_candidate','route_reconsider','deprecate_candidate']);
assert.equal(audit.itemDispositions.length,562);
assert.equal(new Set(audit.itemDispositions.map(x=>x.itemId)).size,562);
assert.equal(audit.constructRepresentation.length,181);
assert.equal(audit.referenceComparisons.length,9);
assert.equal(prior.auditedConstructs,49);
assert.deepEqual(audit.itemDispositions.map(x=>[x.itemId,x.revision]),bank.items.map(x=>[x.id,x.revision]));
for(const item of audit.itemDispositions){
 assert.ok(allowed.has(item.editorialDisposition),item.itemId);
 assert.ok(item.dispositionRationale&&item.semanticTarget&&item.sourceIds.length,item.itemId);
 assert.ok(Array.isArray(item.editorialReviewSourceUrls),item.itemId);
 assert.equal(item.authoredItemTargets.length,item.primaryConstructIds.length+item.secondaryConstructIds.length,item.itemId);
 assert.deepEqual(item.interpretablePropositions.map(x=>x.ruleId),item.interpretationRuleIds,item.itemId);
 for(const proposition of item.interpretablePropositions){
  const rule=ruleById.get(proposition.ruleId),evidence=rule.evidence.find(e=>e.itemId===item.itemId);
  assert.deepEqual(proposition.supportAnswers,evidence.support,item.itemId);
  assert.deepEqual(proposition.opposeAnswers,evidence.oppose,item.itemId);
 }
 assert.deepEqual(Object.keys(item.routeSampleInclusion),['80','120','160','240']);
 for(const [size,n] of Object.entries(item.routeSampleInclusion)){
  assert.ok(n>=0&&n<=32,item.itemId);
  const marginal=item.routeMarginalOpportunity[size];
  assert.equal(marginal.assigned,n,item.itemId);
  for(const count of [marginal.publicRulePathLoss,marginal.facetMinimumLoss,marginal.formatGuaranteeLoss])
   assert.ok(count>=0&&count<=n,item.itemId);
 }
}
for(const id of ['RCI011','RCI018','PLI019','SOI007'])
 assert.equal(audit.itemDispositions.find(item=>item.itemId===id).editorialDisposition,'rewrite_candidate',id);
assert.equal(audit.itemDispositions.find(item=>item.itemId==='RCI011').editorialReviewSourceUrls.length,2);
const researchOnly=new Set(prior.decisions.filter(x=>x.decision==='remain_research_only').map(x=>x.constructId));
for(const item of audit.itemDispositions.filter(x=>x.editorialDisposition==='keep_research_only')){
 assert.ok(item.primaryConstructIds.every(id=>researchOnly.has(id)),item.itemId);
 assert.equal(item.interpretationRuleIds.length,0,item.itemId);
}
for(const size of [80,120,160,240]){
 const route=audit.routeDiagnostics[size];
 assert.equal(route.sampleCount,32);
 assert.equal(route.minDomains,12);
 assert.equal(route.maxDomains,12);
 assert.equal(route.guaranteedFacetIds.length,31);
 assert.equal(route.assessableRuleIdsEverySample.length+route.assessableRuleIdsSomeSamples.length+route.assessableRuleIdsNoSamples.length,model.commitments.length);
 assert.equal(Object.values(route.meanItemsByDomain).reduce((a,b)=>a+b,0),size);
}
assert.equal(audit.routeTransitions.length,3);
for(const transition of audit.routeTransitions){
 assert.equal(transition.pairedSeedCount,32);
 assert.equal(transition.meanRetainedItems+transition.meanDroppedItems,transition.from);
 assert.equal(transition.meanRetainedItems+transition.meanAddedItems,transition.to);
 assert.ok(transition.meanNewRulePaths>=transition.meanLostRulePaths);
}
assert.equal(review.proposedChanges.length,0);
assert.equal(review.releaseMutationApproved,false);
assert.deepEqual(review.structuralGaps.map(x=>x.ruleId),audit.routeDiagnostics[240].assessableRuleIdsNoSamples);
assert.equal(review.structuralGaps.length,35);
for(const gap of review.structuralGaps){
 assert.ok(gap.candidateAdditions.length>=gap.requiredUnits,gap.ruleId);
 assert.ok(gap.candidateAdditions.every(x=>!x.inCurrentFullBundlePool),gap.ruleId);
}
const narrative=fs.readFileSync(new URL('../docs/CONTENT_EFFICIENCY_AUDIT.md',import.meta.url),'utf8');
const labels={keep:'Keep',keep_parallel_indicator:'Keep as parallel indicator',keep_discriminator:'Keep as discriminator',
 keep_research_only:'Keep for research only',rewrite_candidate:'Rewrite candidate',route_reconsider:'Reconsider for route',
 deprecate_candidate:'Deprecate candidate'};
for(const [status,label] of Object.entries(labels)){
 const count=audit.itemDispositions.filter(item=>item.editorialDisposition===status).length;
 assert.ok(narrative.includes(`| ${label} | ${count} |`),'Stale narrative disposition '+status);
}
console.log('PASS content-efficiency: 562 items, 181 constructs, 4 route diagnostics, 9 references, immutable artifacts');
