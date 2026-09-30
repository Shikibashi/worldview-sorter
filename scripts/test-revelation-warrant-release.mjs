import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
import {evaluatePhilosophicalAffinities} from '../packages/worldview/affinities.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const current=currentFromManifest(await read('data/releases/model-release-v1.13.0.json'));
const previous=currentFromManifest(await read('data/releases/model-release-v1.12.0.json'));
const [bank,model,scales,depth,catalog,pilot,ledger,oldBank,oldModel,oldDepth]=await Promise.all([
 read(current.candidateBank.path),read(current.worldviewModel.path),read(current.responseScales.path),
 read(current.progressiveDepth.path),read(current.affinityCatalog.path),read(current.pilotCandidate.path),
 read(current.worldviewSourceLedger.path),read(previous.candidateBank.path),
 read(previous.worldviewModel.path),read(previous.progressiveDepth.path)]);
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,current)).items,568);
assert.equal(oldBank.items.length,567);
assert.deepEqual(bank.items.slice(0,oldBank.items.length),oldBank.items,
 'Historical item definitions and revisions must remain byte-equivalent.');
assert.equal(bank.items.at(-1).id,'EPI122');
assert.equal(bank.items.at(-1).revision,1);
assert.deepEqual(depth.routes.map(row=>row.size),[64,120,243]);
for(const route of depth.routes){
 const old=oldDepth.routes.find(row=>row.id===route.id);
 assert.deepEqual(route.itemRefs.map(row=>row.itemId==='EPI122'?{itemId:'EPI021',itemRevision:1}:row),
  old.itemRefs,'Only the audience-ambiguous item changes in '+route.id);
 assert.ok(!route.itemRefs.some(row=>row.itemId==='EPI021'));
 assert.ok(route.itemRefs.some(row=>row.itemId==='EPI032'));
 assert.ok(route.itemRefs.some(row=>row.itemId==='EPI122'));
 assert.ok(route.assessableDirectRuleIds.includes('audit2-EP10-revelation'));
}
const id='audit2-EP10-revelation',rule=model.commitments.find(row=>row.id===id);
assert.equal(rule.proposition,
 'An apparent divine revelation can sometimes give its experiencer an initial factual reason in favor of its content before independent verification, even if that reason may later be defeated.');
assert.deepEqual(rule.evidence.map(row=>row.itemId),['EPI032','EPI122']);
assert.deepEqual(rule.evidence[0].support,['substantial','some']);
assert.deepEqual(rule.evidence[0].oppose,['none']);
assert.deepEqual(rule.evidence[1].support,['initial_reason']);
assert.deepEqual(rule.evidence[1].oppose,['investigation_only']);
assert.ok(rule.nonEntailments.some(row=>/outsider|public/i.test(row)));
assert.deepEqual(model.commitments.filter(row=>row.id!==id).map(row=>[row.id,row.evidence]),
 oldModel.commitments.filter(row=>row.id!==id).map(row=>[row.id,row.evidence]));
const source=ledger.sources.find(row=>row.id==='sep-religious-experience-warrant');
assert.ok(source?.useByRules.includes(id)&&source.validatesOurItems===false);
assert.ok(rule.sourceClaims.some(row=>row.sourceId===source.id&&row.claim===source.claim));
assert.equal(catalog.traditions.length,11,'Do not inflate the affinity catalog to fill the gap.');

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
 assert.equal(result({EPI032:'some',EPI122:'initial_reason'},routeId).state,'supported');
 assert.equal(result({EPI032:'substantial',EPI122:'initial_reason'},routeId).state,'supported');
 assert.equal(result({EPI032:'none',EPI122:'investigation_only'},routeId).state,'opposed');
 assert.equal(result({EPI032:'some',EPI122:'investigation_only'},routeId).state,'mixed_context_dependent');
 assert.equal(result({EPI032:'none',EPI122:'initial_reason'},routeId).state,'mixed_context_dependent');
 assert.equal(result({EPI032:'some'},routeId).state,'leaned_toward');
 assert.equal(result({EPI032:'little',EPI122:'depends_on_case'},routeId).state,'insufficient_evidence');
 assert.equal(result({EPI032:null,EPI122:null},routeId).state,'insufficient_evidence');
 assert.equal(result({},routeId).state,'insufficient_evidence');
}
assert.throws(()=>result({EPI021:-2,EPI032:null,EPI122:null}),
 /Unpresented item cannot supply evidence/,
 'An old audience-ambiguous answer cannot be smuggled into a current route.');
assert.equal(result({EPI032:'some',EPI122:'depends_on_case'}).state,'leaned_toward',
 'Context dependence does not become opposition.');
assert.equal(result({EPI032:'little',EPI122:'investigation_only'}).state,'leaned_toward',
 'Little is too ambiguous to manufacture a second opposing unit.');
const oldInput={pilotId:oldDepth.administrationId,bankVersion:oldBank.bankVersion,
 instrumentVersion:oldDepth.instrumentVersion,
 presentedItems:oldDepth.routes.find(row=>row.id==='quick').itemRefs.map(row=>({
  ...row,presented:['EPI021','EPI032'].includes(row.itemId),skippedByBranch:false})),
 responses:[{itemId:'EPI021',itemRevision:1,state:'answered',value:-2},
  {itemId:'EPI032',itemRevision:1,state:'answered',value:'substantial'}]};
assert.equal(compareWorldview({model:oldModel,bank:oldBank,scalesDoc:scales,
 input:oldInput,routeManifest:oldDepth}).commitments.find(row=>row.commitmentId===id).state,'supported',
 'The predecessor release must replay its original rule and route.');
const summary=buildQuizSummary({model,bank,scalesDoc:scales,
 session:{...input({EPI032:'some',EPI122:'initial_reason'}),completionStatus:'completed'},
 routeManifest:depth});
const row=summary.rows.find(row=>row.id===id);
assert.equal(row.presentationReview.state,'eligible');
assert.ok(row.sources.some(s=>s.id===source.id&&s.claimScope==='rule_linked'));
const affinity=evaluatePhilosophicalAffinities({catalog,
 report:report({EPI032:'some',EPI122:'initial_reason'}),model,pilot});
assert.equal(affinity.identity,null);assert.equal(affinity.matchPercent,null);
console.log('Revelation warrant: three routes, provisional support, opposition, mixed, missing, audience false positives, source provenance, affinity isolation, and historical replay passed.');
