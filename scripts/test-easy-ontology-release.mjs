import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generatePhilosophyPacket} from '../packages/philosophy/forms.js';
import {compareWorldview,validateModel} from '../packages/worldview/index.js';
import {evaluatePhilosophicalAffinities,validateAffinityCatalog} from '../packages/worldview/affinities.js';

const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const [bank,scalesDoc,model,pilot,form,depth,catalog,pilotPlan,oldModel,oldCatalog]=await Promise.all([
 read('data/items/candidate-v0.9.json'),read('data/response-scales.json'),
 read('data/generic/model-v1.2-pilot.json'),read('data/pilots/pilot-candidate-v1.2.json'),
 read('data/philosophy/public-pilot-v1.2.json'),read('data/experience/progressive-depth-v1.2.json'),
 read('data/affinities/catalog-v1.2.json'),read('data/pilots/pilot-0.2.json'),
 read('data/generic/model-v1.1-pilot.json'),read('data/affinities/catalog-v1.1.json')
]);
assert.equal(validateModel({model,bank,scalesDoc}),true);
assert.equal(validateAffinityCatalog({catalog,model,pilot}),true);
assert.deepEqual(depth.routes.map(r=>r.size),[64,120,238]);
const packet=generatePhilosophyPacket({bank,pilot:pilotPlan,policy:form,size:238,seed:'easy-ontology-release'});
const fullRefs=packet.entries.map(e=>({...e,presented:false,skippedByBranch:false}));
const itemById=new Map(bank.items.map(item=>[item.id,item]));
function report(answers={},route='full'){
 const assigned=route==='full'?fullRefs:depth.routes.find(row=>row.id===route).itemRefs.map(ref=>({
  ...ref,presented:false,skippedByBranch:false}));
 const presentedItems=structuredClone(assigned),responses=[];
 for(const [itemId,value] of Object.entries(answers)){
  const row=presentedItems.find(entry=>entry.itemId===itemId);
  assert.ok(row,'Answer must be assigned to route: '+itemId);
  row.presented=true;
  responses.push({itemId,itemRevision:itemById.get(itemId).revision,
   state:value===null?'no_view':'answered',value});
 }
 return compareWorldview({model,bank,scalesDoc,input:{pilotId:depth.administrationId,bankVersion:bank.bankVersion,
  instrumentVersion:form.instrumentVersion,presentedItems,responses},routeManifest:depth});
}
const proposition=output=>output.commitments.find(row=>row.commitmentId==='construct-OM14');
const historicalDepth=await read('data/experience/progressive-depth-v1.1.json');
const affinity=output=>evaluatePhilosophicalAffinities({catalog,report:output,model,pilot}).traditions
 .find(row=>row.id==='easy-ontology-scoped');
const support=report({OMI109:2,OMI110:2,OMI111:-2});
assert.equal(proposition(support).state,'supported');
const historicalSupport=compareWorldview({model:oldModel,bank,scalesDoc,input:{
 pilotId:historicalDepth.administrationId,bankVersion:bank.bankVersion,instrumentVersion:form.instrumentVersion,
 presentedItems:fullRefs.map(row=>({...row,presented:['OMI109','OMI110','OMI111'].includes(row.itemId)})),
 responses:[['OMI109',2],['OMI110',2],['OMI111',-2]].map(([itemId,value])=>({itemId,
  itemRevision:itemById.get(itemId).revision,state:'answered',value}))},
 routeManifest:historicalDepth});
assert.deepEqual(support.commitments.map(row=>[row.commitmentId,row.state]),
 historicalSupport.commitments.map(row=>[row.commitmentId,row.state]),
 'Adding the scoped comparison must not alter any direct proposition evidence state.');
assert.equal(affinity(support).summaryState,'overlap_on_measured_core');
assert.equal(affinity(support).identityClaim,false);
assert.equal(affinity(support).percentage,null);
const oppose=report({OMI109:-2,OMI110:-2,OMI111:2});
assert.equal(proposition(oppose).state,'opposed');
assert.equal(affinity(oppose).summaryState,'material_divergence');
const mixed=report({OMI109:2,OMI110:-2});
assert.equal(proposition(mixed).state,'mixed_context_dependent');
assert.equal(affinity(mixed).summaryState,'no_sufficiently_established_affinity');
const missing=report({});
assert.equal(proposition(missing).state,'insufficient_evidence');
assert.equal(affinity(missing).summaryState,'no_sufficiently_established_affinity');
const noView=report({OMI109:null,OMI110:null});
assert.equal(proposition(noView).state,'insufficient_evidence');
const short=report({},'quick');
assert.equal(proposition(short).state,'not_measured');
assert.equal(affinity(short).summaryState,'no_sufficiently_established_affinity');
const falsePositive=report({OMI106:2,OMI107:2,OMI108:-2});
assert.equal(falsePositive.commitments.find(row=>row.commitmentId==='construct-OM13').state,'supported');
assert.equal(proposition(falsePositive).state,'insufficient_evidence');
assert.equal(affinity(falsePositive).summaryState,'no_sufficiently_established_affinity');
assert.ok(!oldCatalog.traditions.some(row=>row.id==='easy-ontology-scoped'));
assert.equal(oldModel.commitments.find(row=>row.id==='construct-OM14').proposition,undefined);
assert.deepEqual(form.frozenItems,(await read('data/philosophy/public-pilot-v1.1.json')).frozenItems);
assert.throws(()=>evaluatePhilosophicalAffinities({catalog,report:{responses:[{itemId:'OMI109',value:2}]},model,pilot}));
console.log('Scoped Easy Ontology release: positive, opposing, mixed, missing, no-view, route omission, neighbor, and historical boundaries passed.');
