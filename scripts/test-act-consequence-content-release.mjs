import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {evaluatePhilosophicalAffinities} from '../packages/worldview/affinities.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url),read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const current=await read('data/current.json'),previous=await read('data/releases/model-release-v1.6.0.json');
const old=currentFromManifest(previous);
const [bank,model,scalesDoc,depth,pilot,catalog,oldModel,oldDepth,oldCatalog,draft]=await Promise.all([
 read(current.candidateBank.path),read(current.worldviewModel.path),read(current.responseScales.path),
 read(current.progressiveDepth.path),read(current.pilotCandidate.path),read(current.affinityCatalog.path),
 read(old.worldviewModel.path),read(old.progressiveDepth.path),read(old.affinityCatalog.path),
 read('data/items/affinity-gap-draft-v1.json')]);
const ruleId='reviewed-NE22-act-consequence-criterion';
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,current)).items,565);
assert.equal(bank.items.length,565);
assert.equal(bank.items.find(item=>item.id==='NEI122').revision,1);
assert.equal(bank.items.find(item=>item.id==='NEI014').revision,1);
assert.deepEqual(bank.items.find(item=>item.id==='NEI122').options,
 draft.items.find(item=>item.id==='NEI122').options);
assert.equal(bank.items.find(item=>item.id==='NEI122').text,
 draft.items.find(item=>item.id==='NEI122').text);
assert.equal(draft.items.filter(item=>!bank.items.some(active=>active.id===item.id)).length,24);
assert.equal(oldModel.commitments.some(rule=>rule.id===ruleId),false);
assert.equal(oldDepth.routes.find(route=>route.id==='full').size,240);
assert.equal(oldCatalog.traditions.length,9);
assert.equal(catalog.traditions.length,9);
assert.ok(catalog.traditions.every(tradition=>tradition.commitments.every(c=>
 c.mapping.propositionId!==ruleId)),'The new act criterion must not silently expand a tradition.');
const ref=itemId=>({itemId,itemRevision:bank.items.find(item=>item.id===itemId).revision});
const assigned=id=>depth.routes.find(route=>route.id===id).itemRefs;
assert.deepEqual(depth.routes.map(route=>route.size),[64,120,242]);
assert.ok(['NEI014','NEI122'].every(id=>assigned('full').some(row=>row.itemId===id)));
assert.ok(['quick','standard'].every(routeId=>['NEI014','NEI122'].every(id=>
 !assigned(routeId).some(row=>row.itemId===id))));
assert.deepEqual(assigned('full').filter(row=>!['NEI014','NEI122'].includes(row.itemId)),
 oldDepth.routes.find(route=>route.id==='full').itemRefs,
 'The 240 historical Full item revisions retain their order.');
const input=(answers,routeId='full')=>({pilotId:depth.administrationId,
 bankVersion:bank.bankVersion,instrumentVersion:depth.instrumentVersion,
 presentedItems:assigned(routeId).map(row=>({...row,presented:Object.hasOwn(answers,row.itemId),skippedByBranch:false})),
 responses:Object.entries(answers).map(([itemId,value])=>({
  ...ref(itemId),state:value===null?'no_view':'answered',value}))});
const report=(answers,routeId='full')=>compareWorldview({model,bank,scalesDoc,
 input:input(answers,routeId),routeManifest:depth});
const result=(answers,routeId='full')=>report(answers,routeId).commitments.find(row=>row.commitmentId===ruleId);
assert.equal(result({NEI122:'act_outcome',NEI014:-2}).state,'supported');
assert.equal(result({NEI122:'act_outcome',NEI014:-1}).state,'supported');
assert.equal(result({NEI122:'rule_outcome',NEI014:2}).state,'opposed');
assert.equal(result({NEI122:'rule_independent',NEI014:1}).state,'opposed');
assert.equal(result({NEI122:'act_outcome',NEI014:2}).state,'mixed_context_dependent');
assert.equal(result({NEI122:'rule_outcome',NEI014:-2}).state,'mixed_context_dependent');
assert.equal(result({NEI122:'act_outcome'}).state,'leaned_toward');
assert.equal(result({NEI014:-2}).state,'leaned_toward');
assert.equal(result({NEI122:null,NEI014:null}).state,'insufficient_evidence');
assert.equal(result({}).state,'insufficient_evidence');
assert.equal(result({},'quick').state,'not_measured');
assert.equal(result({},'standard').state,'not_measured');
assert.equal(result({NEI001:2,NEI025:'strong'}).state,'insufficient_evidence',
 'Generic concern for consequences cannot fill the act criterion.');
assert.equal(result({NEI037:2,NEI040:'rules_primary'}).state,'insufficient_evidence',
 'A justified rule cannot fill the direct act criterion.');
const positive=report({NEI122:'act_outcome',NEI014:-2});
assert.equal(evaluatePhilosophicalAffinities({catalog,report:positive,model,pilot}).identity,null);
assert.equal(evaluatePhilosophicalAffinities({catalog,report:positive,model,pilot}).matchPercent,null);
const oldRuleEvidence=oldModel.commitments.map(rule=>[rule.id,rule.evidence]);
assert.deepEqual(model.commitments.filter(rule=>rule.id!==ruleId).map(rule=>[rule.id,rule.evidence]),oldRuleEvidence,
 'Existing evidence maps are unchanged.');
console.log('Act-consequence release: positive, negative, mixed, missing, route omission, nearby false positives, stable affinity, and historical evidence passed.');
