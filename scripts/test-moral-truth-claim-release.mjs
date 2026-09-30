import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url),read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const current=currentFromManifest(await read('data/releases/model-release-v1.10.0.json'));
const previous=currentFromManifest(await read('data/releases/model-release-v1.9.0.json'));
const [bank,model,scales,depth,catalog,oldBank,oldModel,oldDepth,ledger]=await Promise.all([
 read(current.candidateBank.path),read(current.worldviewModel.path),read(current.responseScales.path),
 read(current.progressiveDepth.path),read(current.affinityCatalog.path),read(previous.candidateBank.path),
 read(previous.worldviewModel.path),read(previous.progressiveDepth.path),read(current.worldviewSourceLedger.path)]);
const ruleId='reviewed-ME06-literal-truth-claim';
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,current)).items,566);
assert.deepEqual(bank,oldBank,'No item or historical revision changed.');
assert.equal(oldModel.commitments.some(row=>row.id===ruleId),false);
assert.deepEqual(model.commitments.filter(row=>row.id!==ruleId).map(row=>[row.id,row.evidence]),
 oldModel.commitments.map(row=>[row.id,row.evidence]),'Historical evidence mappings stay intact.');
assert.deepEqual(depth.routes.map(row=>row.itemRefs),oldDepth.routes.map(row=>row.itemRefs),
 'Every public route keeps its exact questions and order.');
assert.deepEqual(depth.routes.map(row=>row.size),[64,120,243]);
assert.deepEqual(depth.routes.map(row=>row.assessableDirectRuleIds.includes(ruleId)),[false,false,true]);
assert.equal(catalog.traditions.length,11);
assert.ok(catalog.traditions.every(t=>t.commitments.every(c=>c.mapping.propositionId!==ruleId)),
 'Literal truth-aptness cannot manufacture moral realism or another affinity.');
const rule=model.commitments.find(row=>row.id===ruleId);
assert.equal(rule.proposition,'Some ordinary moral wrongness statements make claims that can literally be true or false.');
assert.deepEqual(rule.evidence.map(row=>row.itemId+'@'+row.itemRevision),['MEI017@1','MEI018@1']);
assert.ok(ledger.sources.some(row=>row.id==='sep-moral-truth-claim-criterion'&&
 row.claim===rule.sourceClaims[0].claim&&row.useByRules.includes(ruleId)));
const full=depth.routes.find(row=>row.id==='full');
const ref=itemId=>({itemId,itemRevision:bank.items.find(row=>row.id===itemId).revision});
const input=(answers,routeId='full')=>({pilotId:depth.administrationId,
 bankVersion:bank.bankVersion,instrumentVersion:depth.instrumentVersion,
 presentedItems:depth.routes.find(row=>row.id===routeId).itemRefs.map(row=>({...row,
  presented:Object.hasOwn(answers,row.itemId),skippedByBranch:false})),
 responses:Object.entries(answers).map(([itemId,value])=>({...ref(itemId),
  state:value===null?'no_view':'answered',value}))});
const result=(answers,routeId='full')=>compareWorldview({model,bank,scalesDoc:scales,
 input:input(answers,routeId),routeManifest:depth}).commitments.find(row=>row.commitmentId===ruleId);
assert.equal(result({MEI017:2,MEI018:'truth_claim'}).state,'supported');
assert.equal(result({MEI017:-2,MEI018:'prescription'}).state,'opposed');
assert.equal(result({MEI017:2,MEI018:'prescription'}).state,'mixed_context_dependent');
assert.equal(result({MEI017:-2,MEI018:'truth_claim'}).state,'mixed_context_dependent');
assert.equal(result({MEI017:2}).state,'leaned_toward');
assert.equal(result({MEI018:'truth_claim'}).state,'leaned_toward');
assert.equal(result({MEI017:2,MEI018:'attitude'}).state,'leaned_toward',
 'An attitude answer can coexist with a literal truth claim.');
assert.equal(result({MEI017:2,MEI018:'mixed'}).state,'leaned_toward');
assert.equal(result({MEI017:null,MEI018:null}).state,'insufficient_evidence');
assert.equal(result({}).state,'insufficient_evidence');
assert.equal(result({},'quick').state,'not_measured');
assert.equal(result({},'standard').state,'not_measured');
assert.equal(result({MEI002:-2,MEI023:'yes'}).state,'insufficient_evidence',
 'Stance-independence cannot substitute for literal truth-claim evidence.');
assert.ok(full.itemRefs.some(row=>row.itemId==='MEI017')&&full.itemRefs.some(row=>row.itemId==='MEI018'));
console.log('Moral truth-claim release: clear directions, mixed, ambiguous, missing, route omission, false positives, and historical evidence passed.');
