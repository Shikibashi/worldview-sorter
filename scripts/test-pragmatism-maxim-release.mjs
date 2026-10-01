import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {evaluatePhilosophicalAffinities} from '../packages/worldview/affinities.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const successor=currentFromManifest(await read('data/releases/model-release-v1.15.0.json'));
const predecessor=currentFromManifest(await read('data/releases/model-release-v1.14.0.json'));
const [bank,model,scales,depth,catalog,pilot,oldBank,oldModel,oldDepth,oldCatalog,oldPilot]=await Promise.all([
 read(successor.candidateBank.path),read(successor.worldviewModel.path),read(successor.responseScales.path),
 read(successor.progressiveDepth.path),read(successor.affinityCatalog.path),read(successor.pilotCandidate.path),
 read(predecessor.candidateBank.path),read(predecessor.worldviewModel.path),
 read(predecessor.progressiveDepth.path),read(predecessor.affinityCatalog.path),read(predecessor.pilotCandidate.path)]);
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,successor)).items,570);
assert.deepEqual(bank.items.slice(0,oldBank.items.length),oldBank.items,'Old item revisions remain immutable.');
const item=bank.items.at(-1);assert.equal(item.id,'EPI123');assert.equal(item.revision,1);
assert.deepEqual(item.options.map(row=>row.id),
 ['no_substantive_difference','difference_remains','reason_to_question_only']);
assert.deepEqual(depth.routes.map(route=>route.size),[64,120,243]);
for(const route of depth.routes){const prior=oldDepth.routes.find(row=>row.id===route.id);
 if(route.id==='full'){
  assert.deepEqual(route.itemRefs.map(ref=>({
   itemId:ref.itemId==='EPI103'?'EPI105':ref.itemId==='EPI123'?'EPI104':ref.itemId,
   itemRevision:ref.itemRevision})),prior.itemRefs,'Full exchanges exactly two item revisions.');
  assert.ok(route.itemRefs.some(ref=>ref.itemId==='EPI103'));
  assert.ok(route.itemRefs.some(ref=>ref.itemId==='EPI123'));
  assert.ok(!route.itemRefs.some(ref=>['EPI104','EPI105'].includes(ref.itemId)));
 }else assert.deepEqual(route.itemRefs,prior.itemRefs,'Shorter routes preserve exact content.');}
const id='construct-EP16',rule=model.commitments.find(row=>row.id===id);
assert.equal(rule.proposition,
 'Disputed ideas should be clarified through their conceivable effects on experience or conduct; if two formulations have no conceivable difference in those effects, their apparent conceptual difference is not substantive.');
assert.deepEqual(rule.evidence.map(row=>row.itemId),['EPI103','EPI123']);
assert.deepEqual(rule.evidence[1].support,['no_substantive_difference']);
assert.deepEqual(rule.evidence[1].oppose,['difference_remains','reason_to_question_only']);
assert.ok(rule.sourceClaims.some(row=>row.sourceId==='acad-pragmatism'&&row.relationship==='supports'));
assert.ok(rule.nonEntailments.some(row=>/true/i.test(row)));
assert.ok(rule.falsePositives.some(row=>/EPI105/.test(row)));
assert.deepEqual(model.commitments.filter(row=>row.id!==id).map(row=>[row.id,row.evidence]),
 oldModel.commitments.filter(row=>row.id!==id).map(row=>[row.id,row.evidence]));

const input=(route,answers,sourceBank=bank,sourceDepth=depth)=>({
 pilotId:sourceDepth.administrationId,bankVersion:sourceBank.bankVersion,
 instrumentVersion:sourceDepth.instrumentVersion,
 presentedItems:sourceDepth.routes.find(row=>row.id===route).itemRefs.map(ref=>({
  ...ref,presented:Object.hasOwn(answers,ref.itemId),skippedByBranch:false})),
 responses:Object.entries(answers).map(([itemId,value])=>({
  itemId,itemRevision:1,state:value===null?'no_view':'answered',value}))
});
const report=(route,answers)=>compareWorldview({model,bank,scalesDoc:scales,
 input:input(route,answers),routeManifest:depth});
const state=(route,answers)=>report(route,answers).commitments.find(row=>row.commitmentId===id).state;
assert.equal(state('full',{EPI103:2,EPI123:'no_substantive_difference'}),'supported');
assert.equal(state('full',{EPI103:-2,EPI123:'difference_remains'}),'opposed');
assert.equal(state('full',{EPI103:-2,EPI123:'reason_to_question_only'}),'opposed');
assert.equal(state('full',{EPI103:2,EPI123:'reason_to_question_only'}),'mixed_context_dependent',
 'Treating consequences as a helpful clue must not establish the stronger maxim.');
assert.equal(state('full',{EPI103:-2,EPI123:'no_substantive_difference'}),'mixed_context_dependent');
assert.equal(state('full',{EPI103:2}),'leaned_toward');
assert.equal(state('full',{EPI103:2,EPI123:null}),'leaned_toward');
assert.equal(state('full',{EPI103:null,EPI123:null}),'insufficient_evidence');
assert.equal(state('full',{}),'insufficient_evidence');
assert.equal(state('quick',{}),'not_measured');
assert.equal(state('standard',{}),'not_measured');
assert.throws(()=>state('standard',{EPI103:2,EPI123:'no_substantive_difference'}),
 /Unpresented item cannot supply evidence/);
const extraDepth=structuredClone(depth);
for(const oldId of ['EPI104','EPI105']){
 extraDepth.routes.at(-1).itemRefs.push({itemId:oldId,itemRevision:1});extraDepth.routes.at(-1).size++;}
const extraInput=input('full',{EPI103:2});
for(const [oldId,value] of [['EPI104',2],['EPI105',-2]]){
 extraInput.presentedItems.push({itemId:oldId,itemRevision:1,presented:true,skippedByBranch:false});
 extraInput.responses.push({itemId:oldId,itemRevision:1,state:'answered',value});}
assert.equal(compareWorldview({model,bank,scalesDoc:scales,input:extraInput,
 routeManifest:extraDepth}).commitments.find(row=>row.commitmentId===id).state,'leaned_toward',
 'Weak and reverse historical items cannot provide corroboration in the successor.');
assert.equal(state('full',{EPI103:null,EPI123:null,EPI100:2}),'insufficient_evidence',
 'Generic fallibilism cannot substitute for the pragmatic method.');

const positive=report('full',{EPI103:2,EPI123:'no_substantive_difference'});
const affinity=evaluatePhilosophicalAffinities({catalog,report:positive,model,pilot});
assert.equal(affinity.identity,null);assert.equal(affinity.matchPercent,null);
const pragmatism=affinity.traditions.find(row=>row.id==='pragmatism');
assert.equal(pragmatism.criteria.find(row=>row.id==='pragmatic-maxim').finding,'overlap');
assert.equal(pragmatism.criteria.find(row=>row.id==='truth-and-realism').finding,'unmeasured');
const neighbor=evaluatePhilosophicalAffinities({catalog,
 report:report('full',{EPI103:2,EPI123:'reason_to_question_only'}),model,pilot})
 .traditions.find(row=>row.id==='pragmatism');
assert.equal(neighbor.criteria.find(row=>row.id==='pragmatic-maxim').finding,'contradictory');
assert.equal(evaluatePhilosophicalAffinities({catalog,report:report('standard',{}),model,pilot})
 .traditions.find(row=>row.id==='pragmatism').criteria.find(row=>row.id==='pragmatic-maxim').finding,
 'unmeasured');

const oldReport=compareWorldview({model:oldModel,bank:oldBank,scalesDoc:scales,
 input:input('full',{EPI104:2,EPI105:-2},oldBank,oldDepth),routeManifest:oldDepth});
assert.equal(oldReport.commitments.find(row=>row.commitmentId===id).state,'supported',
 'Old administrations retain their historical inference.');
assert.equal(evaluatePhilosophicalAffinities({catalog:oldCatalog,report:oldReport,model:oldModel,pilot:oldPilot})
 .traditions.find(row=>row.id==='pragmatism').criteria.find(row=>row.id==='pragmatic-maxim').finding,
 'overlap','Historical affinity catalog semantics remain pinned.');
const summary=buildQuizSummary({model,bank,scalesDoc:scales,
 session:{...input('full',{EPI103:2,EPI123:'no_substantive_difference'}),completionStatus:'completed'},
 routeManifest:depth,affinityCatalog:catalog,affinityPilot:pilot});
const row=summary.rows.find(value=>value.id===id);
assert.equal(row.presentationReview.state,'eligible');
assert.ok(row.sources.some(source=>source.id==='acad-pragmatism'&&source.claimScope==='rule_linked'));
console.log('Pragmatic maxim: direct method, empty-dispute discriminator, neighbors, missingness, affinity, sources, and history passed.');
