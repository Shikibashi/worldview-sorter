import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generatePhilosophyPacket} from '../packages/philosophy/forms.js';
import {compareWorldview,validateModel} from '../packages/worldview/index.js';
import {evaluatePhilosophicalAffinities} from '../packages/worldview/affinities.js';

const root=new URL('../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const current=await read('data/current.json');
const [bank,model,scalesDoc,depth,form,pilot,catalog,oldBank,oldModel,oldDepth]=await Promise.all([
 read(current.candidateBank.path),read(current.worldviewModel.path),read('data/response-scales.json'),
 read(current.progressiveDepth.path),read(current.fullForm.path),read('data/pilots/pilot-0.2.json'),
 read(current.affinityCatalog.path),read('data/items/candidate-v0.9.json'),
 read('data/generic/model-v1.2-pilot.json'),read('data/experience/progressive-depth-v1.2.json')]);
const ruleId='reviewed-PL34-federal-division';
assert.equal(validateModel({model,bank,scalesDoc}),true);
assert.deepEqual(depth.routes.map(route=>route.size),[64,120,240]);
assert.equal(bank.items.length,564);
assert.ok((await read(current.pilotCandidate.path)).interpretationRules.routeMeasuredDirectRuleIds.includes(ruleId),
 'The versioned pilot must record the new Full-route opportunity.');
assert.ok(!oldBank.items.some(item=>item.id==='PLI126'||item.id==='PLI127'));
assert.ok(!oldModel.commitments.some(rule=>rule.id===ruleId));
assert.deepEqual(oldDepth.routes.map(route=>route.size),[64,120,238]);
for(const route of depth.routes.filter(route=>route.id!=='full')){
 assert.ok(!route.itemRefs.some(ref=>['PLI126','PLI127'].includes(ref.itemId)));
 assert.ok(!route.assessableDirectRuleIds.includes(ruleId));
}
const oldFull=oldDepth.routes.find(route=>route.id==='full').itemRefs;
const newFull=depth.routes.find(route=>route.id==='full').itemRefs;
assert.deepEqual(newFull.filter(ref=>!['PLI126','PLI127'].includes(ref.itemId)),oldFull,
 'The successor must add two items without changing historical wording or ordering.');
const packet=generatePhilosophyPacket({bank,pilot,policy:form,size:240,seed:'federal-review'});
assert.deepEqual(packet.entries.map(({itemId,itemRevision})=>({itemId,itemRevision})),newFull);
const itemById=new Map(bank.items.map(item=>[item.id,item]));
function report(answers={},routeId='full'){
 const assigned=depth.routes.find(route=>route.id===routeId).itemRefs;
 const presentedItems=assigned.map(ref=>({...ref,presented:false,skippedByBranch:false}));
 const responses=Object.entries(answers).map(([itemId,value])=>{
  const presentation=presentedItems.find(entry=>entry.itemId===itemId);
  assert.ok(presentation,'Response must be assigned to '+routeId+': '+itemId);
  presentation.presented=true;
  return {itemId,itemRevision:itemById.get(itemId).revision,state:value===null?'no_view':'answered',value};
 });
 return compareWorldview({model,bank,scalesDoc,input:{pilotId:depth.administrationId,
  bankVersion:bank.bankVersion,instrumentVersion:form.instrumentVersion,presentedItems,responses},routeManifest:depth});
}
const result=answers=>report(answers).commitments.find(row=>row.commitmentId===ruleId);
assert.equal(result({PLI126:'entrenched',PLI127:'respect_division'}).state,'supported');
assert.equal(result({PLI126:'national_delegation',PLI127:'national_override'}).state,'opposed');
assert.equal(result({PLI126:'entrenched',PLI127:'national_override'}).state,'mixed_context_dependent');
assert.equal(result({}).state,'insufficient_evidence');
assert.equal(result({PLI126:null,PLI127:null}).state,'insufficient_evidence');
assert.equal(result({PLI126:'entrenched'}).state,'leaned_toward');
assert.equal(result({PLI126:'regional_delegation',PLI127:'regional_veto'}).state,'insufficient_evidence',
 'Confederation and unilateral regional control must not be interpreted as federal division.');
assert.equal(result({PLI126:'case_by_case',PLI127:'other_reason'}).state,'insufficient_evidence');
assert.equal(report({PLI003:-2,PLI004:2,PLI050:2}).commitments.find(row=>row.commitmentId===ruleId).state,
 'insufficient_evidence','Generic decentralization cannot substitute for the federal criterion.');
assert.equal(report({},'quick').commitments.find(row=>row.commitmentId===ruleId).state,'not_measured');
assert.equal(report({},'standard').commitments.find(row=>row.commitmentId===ruleId).state,'not_measured');
const affinity=evaluatePhilosophicalAffinities({catalog,report:report({PLI126:'entrenched',PLI127:'respect_division'}),model,
 pilot:await read(current.pilotCandidate.path)});
assert.equal(affinity.traditions.length,7,'New content cannot silently add a complete philosophical identity.');
assert.ok(affinity.traditions.every(row=>row.identityClaim===false&&row.percentage===null));
const oldIds=new Set(oldFull.map(ref=>ref.itemId));
assert.ok(newFull.every((ref,index)=>ref.itemId!=='PLI127'||index>newFull.findIndex(row=>row.itemId==='PLI126')));
assert.equal(oldIds.size,238);
console.log('Federal division content: positive, opposed, mixed, missing, skipped, confederation, localism, route omission, affinity boundary, and historical route passed.');
