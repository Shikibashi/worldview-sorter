import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
import {evaluatePhilosophicalAffinities} from '../packages/worldview/affinities.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const current=currentFromManifest(await read('data/releases/model-release-v1.12.0.json'));
const previous=currentFromManifest(await read('data/releases/model-release-v1.11.0.json'));
const [bank,model,scales,depth,catalog,pilot,ledger,oldBank,oldModel,oldDepth]=await Promise.all([
 read(current.candidateBank.path),read(current.worldviewModel.path),read(current.responseScales.path),
 read(current.progressiveDepth.path),read(current.affinityCatalog.path),read(current.pilotCandidate.path),
 read(current.worldviewSourceLedger.path),read(previous.candidateBank.path),
 read(previous.worldviewModel.path),read(previous.progressiveDepth.path)]);
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,current)).items,567);
assert.equal(oldBank.items.length,566);
assert.deepEqual(bank.items.slice(0,oldBank.items.length),oldBank.items,
 'Historical item definitions and revisions remain byte-equivalent.');
assert.equal(bank.items.at(-1).id,'AHI108');
assert.equal(bank.items.at(-1).revision,1);
assert.deepEqual(depth.routes.map(row=>row.size),[64,120,243]);
for(const route of depth.routes){
 const previousRoute=oldDepth.routes.find(row=>row.id===route.id);
 assert.deepEqual(route.itemRefs.map(row=>row.itemId==='AHI108'?{itemId:'AHI104',itemRevision:1}:row),
  previousRoute.itemRefs,'Only AHI104 was replaced at the same position on '+route.id);
 assert.ok(!route.itemRefs.some(row=>row.itemId==='AHI104'));
 assert.ok(route.itemRefs.some(row=>row.itemId==='AHI103'));
 assert.ok(route.itemRefs.some(row=>row.itemId==='AHI108'));
 assert.ok(route.assessableDirectRuleIds.includes('construct-AH14'));
}
const id='construct-AH14',rule=model.commitments.find(row=>row.id===id);
assert.equal(rule.proposition,'If a choice is fixed by the complete prior state of the world and the laws of nature, it cannot be genuinely free.');
assert.deepEqual(rule.evidence.map(row=>row.itemId),['AHI103','AHI105','AHI108']);
assert.deepEqual(rule.evidence.find(row=>row.itemId==='AHI105').support,[],
 'Rejecting a particular compatibilist sufficient condition is nondirectional.');
assert.deepEqual(model.commitments.filter(row=>row.id!==id).map(row=>[row.id,row.evidence]),
 oldModel.commitments.filter(row=>row.id!==id).map(row=>[row.id,row.evidence]),
 'All other directional mappings are preserved.');
for(const sourceId of ['sep-incompatibilism-condition','sep-compatibilism-boundaries']){
 const source=ledger.sources.find(row=>row.id===sourceId);
 assert.ok(source&&source.useByRules.includes(id)&&source.validatesOurItems===false);
 assert.ok(rule.sourceClaims.some(row=>row.sourceId===sourceId&&row.claim===source.claim));
}
assert.equal(catalog.traditions.length,11);
assert.ok(catalog.traditions.every(t=>t.commitments.every(c=>c.mapping.propositionId!==id)),
 'One conditional free-will proposition cannot establish a whole tradition.');

const ref=itemId=>({itemId,itemRevision:bank.items.find(row=>row.id===itemId).revision});
const input=(answers,routeId='quick',sourceBank=bank,sourceDepth=depth)=>({
 pilotId:sourceDepth.administrationId,bankVersion:sourceBank.bankVersion,
 instrumentVersion:sourceDepth.instrumentVersion,
 presentedItems:sourceDepth.routes.find(row=>row.id===routeId).itemRefs.map(row=>({
  ...row,presented:Object.hasOwn(answers,row.itemId),skippedByBranch:false})),
 responses:Object.entries(answers).map(([itemId,value])=>({
  ...ref(itemId),state:value===null?'no_view':'answered',value}))
});
const report=(answers,routeId='quick')=>compareWorldview({model,bank,scalesDoc:scales,
 input:input(answers,routeId),routeManifest:depth});
const result=(answers,routeId='quick')=>report(answers,routeId).commitments.find(row=>row.commitmentId===id);
for(const routeId of ['quick','standard','full']){
 assert.equal(result({AHI103:2,AHI108:'determination_rules_out_freedom'},routeId).state,'supported');
 assert.equal(result({AHI103:-2,AHI108:'determination_can_allow_freedom'},routeId).state,'opposed');
 assert.equal(result({AHI103:2,AHI108:'determination_can_allow_freedom'},routeId).state,'mixed_context_dependent');
 assert.equal(result({AHI103:-2,AHI108:'determination_rules_out_freedom'},routeId).state,'mixed_context_dependent');
 assert.equal(result({AHI103:2},routeId).state,'leaned_toward');
 assert.equal(result({AHI103:null,AHI108:null},routeId).state,'insufficient_evidence');
 assert.equal(result({},routeId).state,'insufficient_evidence');
 assert.equal(result({AHI103:2,AHI108:'other_conditions_matter'},routeId).state,'leaned_toward');
}
assert.equal(result({AHI103:2,AHI108:'other_conditions_matter',AHI105:-2},'full').state,'leaned_toward',
 'Rejecting a single reasons-based condition cannot supply a second support unit.');
assert.equal(result({AHI103:2,AHI108:'determination_rules_out_freedom',AHI105:2},'full').state,
 'mixed_context_dependent');
assert.equal(result({AHI103:-2,AHI108:'other_conditions_matter',AHI105:2},'full').state,'opposed');
assert.equal(result({AHI002:2,AHI103:null,AHI108:null}).state,'insufficient_evidence',
 'Belief that determinism is true does not answer compatibility.');
const oldInput={pilotId:oldDepth.administrationId,bankVersion:oldBank.bankVersion,
 instrumentVersion:oldDepth.instrumentVersion,
 presentedItems:oldDepth.routes.find(row=>row.id==='quick').itemRefs.map(row=>({
  ...row,presented:['AHI103','AHI104'].includes(row.itemId),skippedByBranch:false})),
 responses:[{itemId:'AHI103',itemRevision:1,state:'answered',value:2},
  {itemId:'AHI104',itemRevision:1,state:'answered',value:2}]};
assert.equal(compareWorldview({model:oldModel,bank:oldBank,scalesDoc:scales,
 input:oldInput,routeManifest:oldDepth}).commitments.find(row=>row.commitmentId===id).state,'supported',
 'The historical release replays under its own rule and route.');
const summary=buildQuizSummary({model,bank,scalesDoc:scales,
 session:{...input({AHI103:2,AHI108:'determination_rules_out_freedom'}),completionStatus:'completed'},
 routeManifest:depth});
const row=summary.rows.find(row=>row.id===id);
assert.equal(row.presentationReview.state,'eligible');
assert.ok(row.sources.some(s=>s.id==='sep-incompatibilism-condition'&&s.claimScope==='rule_linked'));
const affinity=evaluatePhilosophicalAffinities({catalog,report:report({
 AHI103:2,AHI108:'determination_rules_out_freedom'}),model,pilot});
assert.equal(affinity.identity,null);assert.equal(affinity.matchPercent,null);
console.log('Free-will condition release: three routes, both directions, mixed, missing, false-positive boundaries, source provenance, affinity isolation, and historical replay passed.');
