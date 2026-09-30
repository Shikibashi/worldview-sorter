import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const current=currentFromManifest(await read('data/releases/model-release-v1.11.0.json'));
const previous=currentFromManifest(await read('data/releases/model-release-v1.10.0.json'));
const [bank,model,scales,depth,catalog,ledger,oldBank,oldModel,oldDepth,oldCatalog]=await Promise.all([
 read(current.candidateBank.path),read(current.worldviewModel.path),read(current.responseScales.path),
 read(current.progressiveDepth.path),read(current.affinityCatalog.path),read(current.worldviewSourceLedger.path),
 read(previous.candidateBank.path),read(previous.worldviewModel.path),read(previous.progressiveDepth.path),
 read(previous.affinityCatalog.path)]);
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,current)).items,566);
assert.deepEqual(bank,oldBank,'No item wording or revision changes.');
assert.deepEqual(depth.routes.map(r=>r.itemRefs),oldDepth.routes.map(r=>r.itemRefs),
 'All 64/120/243 route items and their order remain unchanged.');
assert.deepEqual(model.commitments.map(r=>[r.id,r.evidence]),oldModel.commitments.map(r=>[r.id,r.evidence]),
 'All directional mappings remain unchanged.');
assert.deepEqual(catalog.traditions,oldCatalog.traditions,'No affinity doctrine or mapping changed.');
assert.deepEqual(depth.routes.map(r=>r.size),[64,120,243]);

const approved=[['audit2-EP06-testability','sep-observation-public-testability',['EPI004@2','EPI026@1']]];
for(const [id,sourceId,refs] of approved){
 const rule=model.commitments.find(r=>r.id===id),old=oldModel.commitments.find(r=>r.id===id);
 assert.ok(rule&&model.publicRuleIds.includes(id));
 assert.deepEqual(rule.evidence.map(e=>e.itemId+'@'+e.itemRevision),refs);
 assert.equal(rule.sourceClaims?.find(c=>c.sourceId===sourceId)?.relationship,'supports');
 assert.equal(Boolean(old.sourceClaims?.some(c=>c.relationship==='supports')),false);
 assert.ok(rule.proposition&&rule.nonEntailments?.length&&rule.falsePositives?.length);
 assert.ok(ledger.sources.some(s=>s.id===sourceId&&s.useByRules.includes(id)&&
  s.claim===rule.sourceClaims[0].claim&&s.validatesOurItems===false));
}
assert.deepEqual(model.commitments.find(r=>r.id==='construct-AH14'),
 oldModel.commitments.find(r=>r.id==='construct-AH14'),
 'AH14 remains under its separate evidence-path review.');
for(const id of ['ph-expert-testimony','audit2-EP10-revelation','construct-AH14'])
 assert.equal(Boolean(model.commitments.find(r=>r.id===id).sourceClaims?.some(c=>c.relationship==='supports')),false,
  'An academically interesting neighbor cannot receive a supporting claim without exact item alignment.');

const ref=itemId=>({itemId,itemRevision:bank.items.find(i=>i.id===itemId).revision});
const input=(answers,routeId='quick')=>{
 const route=depth.routes.find(r=>r.id===routeId);
 return {pilotId:depth.administrationId,bankVersion:bank.bankVersion,
  instrumentVersion:depth.instrumentVersion,
  presentedItems:route.itemRefs.map(r=>({...r,presented:Object.hasOwn(answers,r.itemId),skippedByBranch:false})),
  responses:Object.entries(answers).map(([itemId,value])=>({...ref(itemId),
   state:value===null?'no_view':'answered',value}))};
};
const result=(id,answers,routeId='quick')=>{
 return compareWorldview({model,bank,scalesDoc:scales,input:input(answers,routeId),routeManifest:depth})
  .commitments.find(r=>r.commitmentId===id);
};
const ep='audit2-EP06-testability';
assert.equal(result(ep,{EPI004:2,EPI026:-2}).state,'supported');
assert.equal(result(ep,{EPI004:-2,EPI026:2}).state,'opposed');
assert.equal(result(ep,{EPI004:2,EPI026:2}).state,'mixed_context_dependent');
assert.equal(result(ep,{EPI004:2}).state,'leaned_toward');
assert.equal(result(ep,{EPI004:null,EPI026:null}).state,'insufficient_evidence');
assert.equal(result(ep,{}).state,'insufficient_evidence');
assert.equal(result(ep,{EPI005:2,EPI018:-2}).state,'insufficient_evidence',
 'Trust in experts is not a public-testability answer.');
const summary=buildQuizSummary({model,bank,scalesDoc:scales,
 session:{...input({EPI004:2,EPI026:-2}),completionStatus:'completed'},routeManifest:depth});
const row=summary.rows.find(r=>r.id===ep);
assert.equal(row.presentationReview.state,'eligible');
assert.equal(row.sources.find(s=>s.id==='sep-observation-public-testability').claimScope,'rule_linked');
assert.equal(row.sources.find(s=>s.id==='sep-observation-public-testability').claimLinks[0].relationship,'supports');
assert.equal(row.sources.find(s=>s.id==='sep-observation-public-testability').validatesThisQuiz,false);
assert.notEqual(summary.rows.find(r=>r.id==='construct-AH14').presentationReview.state,'eligible',
 'The free-will condition still needs its own evidence-path review.');
console.log('Quick source qualification: unchanged historical evidence, exact source link, route and false-positive regressions passed.');
