import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const successor=currentFromManifest(await read('data/releases/model-release-v1.16.0.json'));
const predecessor=currentFromManifest(await read('data/releases/model-release-v1.15.0.json'));
const [bank,model,scales,depth,catalog,pilot,oldBank,oldModel,oldDepth]=await Promise.all([
 read(successor.candidateBank.path),read(successor.worldviewModel.path),read(successor.responseScales.path),
 read(successor.progressiveDepth.path),read(successor.affinityCatalog.path),read(successor.pilotCandidate.path),
 read(predecessor.candidateBank.path),read(predecessor.worldviewModel.path),read(predecessor.progressiveDepth.path)]);
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,successor)).items,570);
assert.deepEqual(bank,oldBank,'No item or revision changed in the sacred-status scope release.');
assert.deepEqual(depth.routes.map(row=>row.itemRefs),oldDepth.routes.map(row=>row.itemRefs),
 'No route gains or loses an item revision.');
assert.deepEqual(depth.routes.map(row=>row.size),[64,120,243]);
const id='ph-sacred-value',rule=model.commitments.find(row=>row.id===id),oldRule=oldModel.commitments.find(row=>row.id===id);
assert.equal(rule.proposition,
 'In the stated community-object and practical-benefit case, sacred status itself can carry at least some moral weight beyond the object\'s ordinary resource value and the specified direct harm to persons.');
assert.deepEqual(rule.evidence,oldRule.evidence,'Exact answer-to-evidence meanings and thresholds remain unchanged.');
assert.ok(rule.sourceClaims.some(claim=>claim.sourceId==='rotondo-sacred-2026'&&claim.relationship==='supports'));
assert.ok(rule.sourceClaims.some(claim=>claim.sourceId==='katsafanas-sacred-values-2022'&&claim.relationship==='challenges'));
assert.ok(rule.nonEntailments.some(text=>/inviolable/.test(text)));
assert.ok(rule.nonEntailments.some(text=>/independently of attitudes/.test(text)));
assert.ok(rule.nonEntailments.some(text=>/deity/.test(text)));
assert.deepEqual(model.commitments.filter(row=>row.id!==id).map(row=>[row.id,row.evidence]),
 oldModel.commitments.filter(row=>row.id!==id).map(row=>[row.id,row.evidence]));
const comparison=model.comparisons.find(row=>row.id==='compare-ph-sacred-value');
assert.equal(comparison.scope,rule.proposition);
assert.ok(!/independent normative weight/.test(comparison.label));
const input=(route,answers,sourceDepth=depth)=>({
 pilotId:sourceDepth.administrationId,bankVersion:bank.bankVersion,
 instrumentVersion:sourceDepth.instrumentVersion,
 presentedItems:sourceDepth.routes.find(row=>row.id===route).itemRefs.map(ref=>({
  ...ref,presented:Object.hasOwn(answers,ref.itemId),skippedByBranch:false})),
 responses:Object.entries(answers).map(([itemId,value])=>({itemId,itemRevision:1,
  state:value===null?'no_view':'answered',value}))
});
const report=(route,answers,sourceModel=model,sourceDepth=depth)=>compareWorldview({
 model:sourceModel,bank,scalesDoc:scales,input:input(route,answers,sourceDepth),routeManifest:sourceDepth});
const state=(route,answers)=>report(route,answers).commitments.find(row=>row.commitmentId===id).state;
assert.equal(state('full',{RCI012:2,RCI029:'some'}),'supported',
 'Tradeoff-permitting some weight supports only the narrow claim.');
assert.equal(state('full',{RCI012:2,RCI029:'very_high'}),'supported');
assert.equal(state('full',{RCI012:-2,RCI029:'symbolic'}),'opposed',
 'Concern for human relationships alone is not additional status weight.');
assert.equal(state('full',{RCI012:-2,RCI029:'none'}),'opposed');
assert.equal(state('full',{RCI012:2,RCI029:'symbolic'}),'mixed_context_dependent');
assert.equal(state('full',{RCI012:-2,RCI029:'some'}),'mixed_context_dependent');
assert.equal(state('full',{RCI012:2}),'leaned_toward');
assert.equal(state('full',{RCI012:2,RCI029:null}),'leaned_toward');
assert.equal(state('full',{RCI012:null,RCI029:null}),'insufficient_evidence');
assert.equal(state('full',{}),'insufficient_evidence');
assert.equal(state('quick',{}),'not_measured');
assert.equal(state('standard',{}),'not_measured');
const historical=report('full',{RCI012:2,RCI029:'some'},oldModel,oldDepth);
assert.equal(historical.commitments.find(row=>row.commitmentId===id).state,'supported');
assert.match(oldRule.scope,/independent normative weight/);
const summary=buildQuizSummary({model,bank,scalesDoc:scales,
 session:{...input('full',{RCI012:2,RCI029:'some'}),completionStatus:'completed'},
 routeManifest:depth,affinityCatalog:catalog,affinityPilot:pilot});
const row=summary.rows.find(value=>value.id===id);
assert.equal(row.presentationReview.state,'eligible');
assert.equal(row.proposition,rule.proposition);
assert.ok(row.sources.some(source=>source.id==='rotondo-sacred-2026'&&source.claimScope==='rule_linked'));
assert.ok(!summary.affinities.traditions.some(tradition=>tradition.criteria.some(criterion=>
 criterion.mapping.propositionId===id)),'A sacred-status answer does not create a tradition affinity.');
console.log('Sacred-status scope: narrow weight, tradeoff, secular/attitude limits, mixed, missing, sources, route, and history passed.');
