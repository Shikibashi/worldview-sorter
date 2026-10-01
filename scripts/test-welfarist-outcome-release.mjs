import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const successor=currentFromManifest(await read('data/releases/model-release-v1.17.0.json'));
const predecessor=currentFromManifest(await read('data/releases/model-release-v1.16.0.json'));
const [bank,model,scales,depth,catalog,pilot,oldBank,oldModel,oldDepth]=await Promise.all([
 read(successor.candidateBank.path),read(successor.worldviewModel.path),read(successor.responseScales.path),
 read(successor.progressiveDepth.path),read(successor.affinityCatalog.path),read(successor.pilotCandidate.path),
 read(predecessor.candidateBank.path),read(predecessor.worldviewModel.path),read(predecessor.progressiveDepth.path)]);
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,successor)).items,572);
assert.deepEqual(depth.routes.map(row=>row.size),[64,120,245]);
assert.deepEqual(depth.routes.slice(0,2).map(row=>row.itemRefs),oldDepth.routes.slice(0,2).map(row=>row.itemRefs));
assert.equal(oldBank.items.length,570);
assert.ok(!oldModel.commitments.some(row=>row.id==='reviewed-NE24-welfarist-outcome-value'));
const rule=model.commitments.find(row=>row.id==='reviewed-NE24-welfarist-outcome-value');
assert.ok(rule);
assert.deepEqual(rule.evidence.map(row=>row.itemId+'@'+row.itemRevision),['NEI124@2','NEI132@1']);
assert.equal(rule.minimumEvidenceUnits,2);
assert.ok(rule.nonEntailments.some(row=>/Utilitarianism/.test(row)));
assert.ok(rule.nonEntailments.some(row=>/rights or promises/.test(row)));
assert.ok(rule.sourceClaims.some(row=>row.sourceId==='sep-welfarism-outcome-value'&&row.relationship==='supports'));
assert.ok(rule.sourceClaims.some(row=>row.sourceId==='sep-plural-outcome-value'&&row.relationship==='supports'));
assert.ok(!catalog.traditions.some(row=>row.commitments?.some(c=>c.mapping?.propositionId===rule.id)));
const item124=bank.items.find(row=>row.id==='NEI124');
assert.equal(item124.revision,2);
assert.ok(!item124.options.some(row=>row.id==='rights_priority'));
const historicalDraft=await read('data/items/affinity-gap-draft-v1.json');
assert.ok(JSON.stringify(historicalDraft).includes('rights_priority'));

const input=(route,answers,policy=depth)=>({
 pilotId:policy.administrationId,bankVersion:bank.bankVersion,instrumentVersion:policy.instrumentVersion,
 presentedItems:policy.routes.find(row=>row.id===route).itemRefs.map(ref=>({
  ...ref,presented:Object.hasOwn(answers,ref.itemId),skippedByBranch:false})),
 responses:Object.entries(answers).map(([itemId,value])=>({itemId,
  itemRevision:itemId==='NEI124'?2:1,state:value===null?'no_view':'answered',value}))
});
const report=(route,answers)=>compareWorldview({model,bank,scalesDoc:scales,
 input:input(route,answers),routeManifest:depth});
const state=(route,answers)=>report(route,answers).commitments.find(row=>row.commitmentId===rule.id).state;
assert.equal(state('full',{NEI124:'welfare_only',NEI132:'no_welfare_change'}),'supported');
assert.equal(state('full',{NEI124:'other_good',NEI132:'independent_beauty'}),'opposed');
assert.equal(state('full',{NEI124:'welfare_only',NEI132:'independent_beauty'}),'mixed_context_dependent');
assert.equal(state('full',{NEI124:'other_good',NEI132:'no_welfare_change'}),'mixed_context_dependent');
assert.equal(state('full',{NEI124:'welfare_only'}),'leaned_toward');
assert.equal(state('full',{NEI132:'no_welfare_change'}),'leaned_toward',
 'Denying beauty in this one case cannot support general welfarism.');
assert.equal(state('full',{NEI124:'context',NEI132:'unclear_case'}),'insufficient_evidence');
assert.equal(state('full',{NEI124:null,NEI132:null}),'insufficient_evidence');
assert.equal(state('full',{}),'insufficient_evidence');
assert.equal(state('quick',{}),'not_measured');
assert.equal(state('standard',{}),'not_measured');
const summary=buildQuizSummary({model,bank,scalesDoc:scales,
 session:{...input('full',{NEI124:'welfare_only',NEI132:'no_welfare_change'}),completionStatus:'completed'},
 routeManifest:depth,affinityCatalog:catalog,affinityPilot:pilot});
const row=summary.rows.find(value=>value.id===rule.id);
assert.equal(row.status,'supported');
assert.ok(row.sources.some(source=>source.id==='sep-welfarism-outcome-value'&&source.claimScope==='rule_linked'));
assert.ok(!summary.affinities.traditions.some(tradition=>tradition.criteria.some(criterion=>
 criterion.mapping.propositionId===rule.id)));
console.log('Welfarist outcome value: direct, opposed, mixed, lean, missing, routes, sources, affinities, and historical pinning passed.');
