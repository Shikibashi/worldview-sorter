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
 assert.deepEqual(Object.keys(item.routeSampleInclusion),['80','120','160','240']);
 for(const n of Object.values(item.routeSampleInclusion))assert.ok(n>=0&&n<=32,item.itemId);
}
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
assert.equal(review.proposedChanges.length,0);
assert.equal(review.releaseMutationApproved,false);
assert.deepEqual(review.structuralGaps.map(x=>x.ruleId),audit.routeDiagnostics[240].assessableRuleIdsNoSamples);
assert.equal(review.structuralGaps.length,35);
for(const gap of review.structuralGaps){
 assert.ok(gap.candidateAdditions.length>=gap.requiredUnits,gap.ruleId);
 assert.ok(gap.candidateAdditions.every(x=>!x.inCurrentFullBundlePool),gap.ruleId);
}
console.log('PASS content-efficiency: 562 items, 181 constructs, 4 route diagnostics, 9 references, immutable artifacts');
