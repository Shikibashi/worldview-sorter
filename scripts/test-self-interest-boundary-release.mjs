import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {evaluatePhilosophicalAffinities} from '../packages/worldview/affinities.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const successor=currentFromManifest(await read('data/releases/model-release-v1.14.0.json'));
const predecessor=currentFromManifest(await read('data/releases/model-release-v1.13.0.json'));
const [bank,model,scales,depth,catalog,pilot,oldBank,oldModel,oldDepth,oldCatalog,oldPilot]=await Promise.all([
 read(successor.candidateBank.path),read(successor.worldviewModel.path),read(successor.responseScales.path),
 read(successor.progressiveDepth.path),read(successor.affinityCatalog.path),read(successor.pilotCandidate.path),
 read(predecessor.candidateBank.path),read(predecessor.worldviewModel.path),
 read(predecessor.progressiveDepth.path),read(predecessor.affinityCatalog.path),read(predecessor.pilotCandidate.path)]);
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,successor)).items,569);
assert.deepEqual(bank.items.slice(0,oldBank.items.length),oldBank.items,
 'Existing item revisions must remain unchanged.');
const item=bank.items.at(-1);
assert.equal(item.id,'NEI121');assert.equal(item.revision,1);
assert.deepEqual(item.options.map(option=>option.id),
 ['independent_duty','independent_reason','own_good_only','context_matters']);
assert.deepEqual(depth.routes.map(route=>route.size),[64,120,243]);
for(const route of depth.routes){
 const old=oldDepth.routes.find(row=>row.id===route.id);
 if(route.id==='full'){
  assert.deepEqual(route.itemRefs.map(row=>row.itemId==='NEI121'?{itemId:'NEI101',itemRevision:1}:row),
   old.itemRefs,'Full must change only one exact item revision.');
  assert.ok(route.itemRefs.some(row=>row.itemId==='NEI100'));
  assert.ok(route.itemRefs.some(row=>row.itemId==='NEI121'));
  assert.ok(!route.itemRefs.some(row=>row.itemId==='NEI101'));
 }else assert.deepEqual(route.itemRefs,old.itemRefs,
  'Shorter routes must not acquire this conclusion by proxy.');
}
const id='construct-NE15',rule=model.commitments.find(row=>row.id===id);
assert.equal(rule.proposition,
 'Each person morally ought to make their own long-term good the ultimate end of their actions; another person’s need alone supplies no independent moral reason.');
assert.deepEqual(rule.evidence.map(row=>row.itemId),['NEI100','NEI101','NEI121']);
assert.equal(rule.evidence[0].unitId,rule.evidence[1].unitId,
 'Near-parallel statements count as one authored directional unit.');
assert.notEqual(rule.evidence[2].unitId,rule.evidence[0].unitId);
assert.deepEqual(rule.evidence[2].support,['own_good_only']);
assert.deepEqual(rule.evidence[2].oppose,['independent_duty','independent_reason']);
assert.ok(!rule.evidence.some(row=>row.itemId==='NEI102'));
assert.ok(rule.nonEntailments.some(row=>/benevolen|help/i.test(row)));
assert.ok(rule.nonEntailments.some(row=>/maximiz/i.test(row)));
assert.deepEqual(model.commitments.filter(row=>row.id!==id).map(row=>[row.id,row.evidence]),
 oldModel.commitments.filter(row=>row.id!==id).map(row=>[row.id,row.evidence]));

const makeInput=(route,answers,sourceBank=bank,sourceDepth=depth)=>({
 pilotId:sourceDepth.administrationId,bankVersion:sourceBank.bankVersion,
 instrumentVersion:sourceDepth.instrumentVersion,
 presentedItems:sourceDepth.routes.find(row=>row.id===route).itemRefs.map(row=>({
  ...row,presented:Object.hasOwn(answers,row.itemId),skippedByBranch:false})),
 responses:Object.entries(answers).map(([itemId,value])=>({
  itemId,itemRevision:1,state:value===null?'no_view':'answered',value}))
});
const report=(route,answers)=>compareWorldview({model,bank,scalesDoc:scales,
 input:makeInput(route,answers),routeManifest:depth});
const state=(route,answers)=>report(route,answers).commitments.find(row=>row.commitmentId===id).state;
assert.equal(state('full',{NEI100:2,NEI121:'own_good_only'}),'supported');
assert.equal(state('full',{NEI100:-2,NEI121:'independent_duty'}),'opposed');
assert.equal(state('full',{NEI100:-2,NEI121:'independent_reason'}),'opposed',
 'A non-obligatory independent moral reason opposes the narrow conjunction.');
assert.equal(state('full',{NEI100:2,NEI121:'independent_reason'}),'mixed_context_dependent');
assert.equal(state('full',{NEI100:-2,NEI121:'own_good_only'}),'mixed_context_dependent');
assert.equal(state('full',{NEI100:2,NEI121:'context_matters'}),'leaned_toward');
assert.equal(state('full',{NEI100:2}),'leaned_toward');
assert.equal(state('full',{NEI100:2,NEI121:null}),'leaned_toward');
assert.equal(state('full',{NEI100:null,NEI121:null}),'insufficient_evidence');
assert.equal(state('full',{}),'insufficient_evidence');
const pairedDepth=structuredClone(depth);
pairedDepth.routes.at(-1).itemRefs.push({itemId:'NEI101',itemRevision:1});
pairedDepth.routes.at(-1).size++;
const pairedInput=makeInput('full',{NEI100:2});
pairedInput.presentedItems.push({itemId:'NEI101',itemRevision:1,presented:true,skippedByBranch:false});
pairedInput.responses.push({itemId:'NEI101',itemRevision:1,state:'answered',value:2});
assert.equal(compareWorldview({model,bank,scalesDoc:scales,input:pairedInput,
 routeManifest:pairedDepth}).commitments.find(row=>row.commitmentId===id).state,'leaned_toward',
 'Even if both near-parallel items were administered, they cannot supply two units.');
assert.equal(state('quick',{}),'not_measured');
assert.equal(state('standard',{}),'not_measured');
assert.throws(()=>state('standard',{NEI100:2,NEI121:'own_good_only'}),
 /Unpresented item cannot supply evidence/);

const currentAffinity=evaluatePhilosophicalAffinities({catalog,
 report:report('full',{NEI100:2,NEI121:'own_good_only'}),model,pilot});
assert.equal(currentAffinity.identity,null);assert.equal(currentAffinity.matchPercent,null);
const egoism=currentAffinity.traditions.find(row=>row.id==='ethical-egoism');
const egoismCriterion=egoism.criteria.find(row=>row.id==='moral-self-interest');
assert.equal(egoismCriterion.finding,'overlap');
assert.equal(egoism.criteria.find(row=>row.id==='rightness-by-own-good').finding,'unmeasured');
const objectivism=currentAffinity.traditions.find(row=>row.id==='objectivism-rand');
assert.equal(objectivism.criteria.find(row=>row.id==='rational-self-interest').finding,'partial',
 'Generic normative self-interest cannot establish Rand’s complete ethics.');
assert.ok(!objectivism.overlap.some(row=>row.id==='rational-self-interest'));
const objectivismOpposed=evaluatePhilosophicalAffinities({catalog,
 report:report('full',{NEI100:-2,NEI121:'independent_reason'}),model,pilot})
 .traditions.find(row=>row.id==='objectivism-rand');
assert.equal(objectivismOpposed.criteria.find(row=>row.id==='rational-self-interest').finding,'partial',
 'The narrow proposition cannot settle divergence from Rand’s complete ethics either.');
assert.equal(evaluatePhilosophicalAffinities({catalog,
 report:report('full',{NEI100:2,NEI121:'independent_reason'}),model,pilot})
 .traditions.find(row=>row.id==='ethical-egoism').criteria.find(row=>row.id==='moral-self-interest').finding,
 'contradictory','A self-care duty plus other-regarding moral reason is not settled egoism.');
assert.equal(evaluatePhilosophicalAffinities({catalog,
 report:report('standard',{}),model,pilot})
 .traditions.find(row=>row.id==='ethical-egoism').criteria.find(row=>row.id==='moral-self-interest').finding,
 'unmeasured');

const oldInput=makeInput('full',{NEI100:2,NEI101:2},oldBank,oldDepth);
const oldReport=compareWorldview({model:oldModel,bank:oldBank,scalesDoc:scales,
 input:oldInput,routeManifest:oldDepth});
assert.equal(oldReport.commitments.find(row=>row.commitmentId===id).state,'supported',
 'Historical administrations replay under the old rule.');
const historicalAffinity=evaluatePhilosophicalAffinities({catalog:oldCatalog,report:oldReport,
 model:oldModel,pilot:oldPilot});
assert.equal(historicalAffinity.traditions.find(row=>row.id==='objectivism-rand')
 .criteria.find(row=>row.id==='rational-self-interest').finding,'overlap',
 'Historical catalog semantics remain reproducible rather than silently reinterpreted.');
const summary=buildQuizSummary({model,bank,scalesDoc:scales,
 session:{...makeInput('full',{NEI100:2,NEI121:'own_good_only'}),completionStatus:'completed'},
 routeManifest:depth,affinityCatalog:catalog,affinityPilot:pilot});
const publicRow=summary.rows.find(row=>row.id===id);
assert.equal(publicRow.presentationReview.state,'eligible');
assert.ok(publicRow.sources.some(source=>source.id==='acad-egoism'&&
 source.claimScope==='rule_linked'));
console.log('Self-interest boundary: direct evidence, near-parallel units, incomplete routes, affinity limits, false positives, and historical replay passed.');
